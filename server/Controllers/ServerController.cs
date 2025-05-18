using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.Server;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Hubs;
using HPEChat_Server.Interfaces;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		private readonly IHubContext<ServerHub, IServerClient> _hub;
		public ServerController(ApplicationDBContext context, IHubContext<ServerHub, IServerClient> hub)
		{
			_context = context;
			_hub = hub;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerDto>> CreateServer([FromBody] CreateServerDto createServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var user = await _context.Users.FindAsync(Guid.Parse(userId));
			if (user == null) return BadRequest("User not found");

			if (await _context.Servers.AnyAsync(s => s.Name.ToUpper() == createServerDto.Name.ToUpper()))
				return BadRequest("Server with that name already exists");

			var server = new Server
			{
				Name = createServerDto.Name,
				Description = createServerDto.Description,
				OwnerId = Guid.Parse(userId)
			};

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					server.Members.Add(user);

					await _context.Servers.AddAsync(server);
					await _context.SaveChangesAsync();
					await transaction.CommitAsync();
				}
				catch
				{
					await transaction.RollbackAsync();
					return StatusCode(500);
				}
			}

			return Ok(new ServerDto
			{
				Id = server.Id.ToString().ToUpper(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString().ToUpper(),
				Members = new List<UserInfoDto>()
				{
					new UserInfoDto
					{
						Id = user.Id.ToString().ToUpper(),
						Username = user.Username,
					}
				},
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> UpdateServer(Guid id, [FromBody] CreateServerDto updateServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = id;

			var server = await _context.Servers.FindAsync(serverGuid);
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId.ToString() != userId) return BadRequest("You are not the owner of this server");

			server.Name = updateServerDto.Name ?? server.Name;
			server.Description = updateServerDto.Description ?? server.Description;

			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString().ToUpper(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString().ToUpper(),
			});
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<List<ServerDto>>> GetServers()
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid userGuid = Guid.Parse(userId);

			var servers = await _context.Servers
				.Where(s => s.Members.Any(u => u.Id == userGuid))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString().ToUpper(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString().ToUpper(),
				})
				.OrderBy(s => s.Name)
				.ToListAsync();

			return Ok(servers);
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> GetServer(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.Where(s => s.Id == serverGuid && s.Members.Any(m => m.Id == userGuid))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString().ToUpper(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString().ToUpper(),
					Members = s.Members.Select(m => new UserInfoDto
					{
						Id = m.Id.ToString().ToUpper(),
						Username = m.Username,
					})
					.OrderBy(m => m.Username)
					.ToList(),
					Channels = s.Channels.Select(c => new ChannelDto
					{
						Id = c.Id.ToString().ToUpper(),
						Name = c.Name,
					})
					.OrderBy(c => c.Name)
					.ToList()
				})
				.FirstOrDefaultAsync();

			if (server == null) return NotFound("Server not found");

			return Ok(server);
		}

		[HttpPost("join/{name}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> JoinServer(string name)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Name == name);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId == userGuid) return BadRequest("You are the owner of this server");

			if (server.Members.Any(m => m.Id == userGuid)) return BadRequest("You are already a member of this server");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					var userEntity = server.Members.FirstOrDefault(m => m.Id == userGuid);
					if (userEntity == null) return BadRequest("User not found in server members");
					await _context.SaveChangesAsync();

					await _hub
							.Clients
							.Group(ServerHub.GroupName(server.Id))
							.UserJoined(server.Id, new UserInfoDto
							{
								Id = userId,
								Username = User.Identity!.Name!,
							});

					await transaction.CommitAsync();

					return Ok(new ServerDto
					{
						Id = server.Id.ToString().ToUpper(),
						Name = server.Name,
						Description = server.Description,
						OwnerId = server.OwnerId.ToString().ToUpper()
					});
				}
				catch
				{
					await transaction.RollbackAsync();
					return StatusCode(500);
				}
			}
		}

		[HttpDelete("leave/{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> LeaveServer(Guid id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id == serverGuid);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId == userGuid) return BadRequest("You are the owner of this server, you can't leave it");

			if (!server.Members.Any(m => m.Id == userGuid)) return BadRequest("You are not a member of this server");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					var userEntity = server.Members.FirstOrDefault(m => m.Id == userGuid);
					if (userEntity == null) return BadRequest("User not found in server members");
					server.Members.Remove(userEntity);

					await _context.SaveChangesAsync();

					await _hub
						.Clients
						.Group(ServerHub.GroupName(server.Id))
						.UserLeft(server.Id, userGuid);

					await transaction.CommitAsync();

					return Ok(new ServerDto
					{
						Id = server.Id.ToString().ToUpper(),
						Name = server.Name,
						Description = server.Description,
						OwnerId = server.OwnerId.ToString().ToUpper()
					});
				}
				catch
				{
					await transaction.RollbackAsync();
					return StatusCode(500);
				}
			}

		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteServer(Guid id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.FirstOrDefaultAsync(s => s.Id == serverGuid && s.OwnerId == userGuid);
			if (server == null) return NotFound("Server not found");

			_context.Servers.Remove(server);

			await _context.SaveChangesAsync();
			return Ok(new { message = "Server deleted successfully" });
		}

		[HttpDelete("kick/{serverId}/{userId}")]
		[Authorize]
		public async Task<ActionResult> KickUser(Guid serverId, Guid userId)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var ownerId = User.GetUserId();
			if (ownerId == null) return BadRequest("User not found");

			Guid ownerGuid = Guid.Parse(ownerId);

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id == serverId && s.OwnerId == ownerGuid && s.Members.Any(m => m.Id == userId));
			if (server == null) return NotFound("Server or user not found");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					var userEntity = server.Members.FirstOrDefault(m => m.Id == userId);
					if (userEntity == null) return BadRequest("User not found in server members");
					server.Members.Remove(userEntity);

					await _context.SaveChangesAsync();

					await _hub
						.Clients
						.Group(ServerHub.GroupName(server.Id))
						.UserLeft(server.Id, userId);

					await transaction.CommitAsync();

					return Ok(new { message = "User kicked from server" });
				}
				catch
				{
					await transaction.RollbackAsync();
					return StatusCode(500);
				}
			}
		}
	}
}
