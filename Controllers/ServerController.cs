using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.Server;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		public ServerController(ApplicationDBContext context)
		{
			_context = context;
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
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString(),
				Members = new List<UserInfoDto>()
				{
					new UserInfoDto
					{
						Id = user.Id.ToString(),
						Username = user.Username,
					}
				},
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> UpdateServer(string id, [FromBody] CreateServerDto updateServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = Guid.Parse(id);

			var server = await _context.Servers.FindAsync(serverGuid);
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId.ToString() != userId) return BadRequest("You are not the owner of this server");

			server.Name = updateServerDto.Name ?? server.Name;
			server.Description = updateServerDto.Description ?? server.Description;

			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString(),
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
					Id = s.Id.ToString(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString(),
				})
				.OrderBy(s => s.Name)
				.ToListAsync();

			return Ok(servers);
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> GetServer(string id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = Guid.Parse(id);
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.Where(s => s.Id == serverGuid && s.Members.Any(m => m.Id == userGuid))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString(),
					Members = s.Members.Select(m => new UserInfoDto
					{
						Id = m.Id.ToString(),
						Username = m.Username,
					})
					.OrderBy(m => m.Username)
					.ToList(),
					Channels = s.Channels.Select(c => new ChannelDto
					{
						Id = c.Id.ToString(),
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

			var user = await _context.Users.FindAsync(userGuid);
			if (user == null) return BadRequest("User not found");

			if (server.Members.Any(m => m.Id == user.Id)) return BadRequest("You are already a member of this server");

			server.Members.Add(user);
			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}

		[HttpPost("leave/{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> LeaveServer(string id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = Guid.Parse(id);
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.FirstOrDefaultAsync(s => s.Id == serverGuid);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId == userGuid) return BadRequest("You are the owner of this server, you can't leave it");

			var user = await _context.Users.FindAsync(userGuid);
			if (user == null) return BadRequest("User not found");

			if (!server.Members.Any(m => m.Id == user.Id)) return BadRequest("You are not a member of this server");

			server.Members.Remove(user);
			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteServer(string id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid serverGuid = Guid.Parse(id);
			Guid userGuid = Guid.Parse(userId);

			var server = await _context.Servers
				.FirstOrDefaultAsync(s => s.Id == serverGuid && s.OwnerId == userGuid);
			if (server == null) return NotFound("Server not found");

			_context.Servers.Remove(server);

			await _context.SaveChangesAsync();
			return Ok(new { message = "Server deleted successfully" });
		}

		[HttpPost("kick/{serverId}/{userId}")]
		[Authorize]
		public async Task<ActionResult> KickUser(string serverId, string userId)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var ownerId = User.GetUserId();
			if (ownerId == null) return BadRequest("User not found");

			Guid serverGuid = Guid.Parse(serverId);
			Guid userGuid = Guid.Parse(userId);
			Guid ownerGuid = Guid.Parse(ownerId);

			var user = await _context.Users.FindAsync(userGuid);
			if (user == null) return NotFound("User not found");

			var server = await _context.Servers
				.Where(s => s.Id == serverGuid && s.OwnerId == ownerGuid && s.Members.Any(m => m.Id == userGuid))
				.FirstOrDefaultAsync();
			if (server == null) return NotFound("Server or user not found");

			server.Members.Remove(user);
			await _context.SaveChangesAsync();
			
			return Ok(new { message = "User kicked from server" });
		}
	}
}
