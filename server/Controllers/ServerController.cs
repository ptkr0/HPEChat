using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.Server;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Hubs;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
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
		private readonly ConnectionMapperService _mapper;
		private readonly FileService _fileService;
		private readonly ILogger<ServerController> _logger;
		public ServerController(
			ApplicationDBContext context, 
			IHubContext<ServerHub, IServerClient> hub, 
			ConnectionMapperService mapper, 
			FileService fileService,
			ILogger<ServerController> logger)
		{
			_context = context;
			_hub = hub;
			_mapper = mapper;
			_fileService = fileService;
			_logger = logger;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerDto>> CreateServer([FromForm] CreateServerDto createServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var user = await _context.Users.FindAsync(userId);
			if (user == null) return BadRequest("User not found");

			if (await _context.Servers.AnyAsync(s => s.Name.ToUpper() == createServerDto.Name.ToUpper()))
				return BadRequest("Server with that name already exists");

			var server = new Server
			{
				Name = createServerDto.Name,
				Description = createServerDto.Description ?? string.Empty,
				OwnerId = (Guid)userId,
			};

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				string? uploadedServerImage = null;

				try
				{
					server.Members.Add(user);

					await _context.Servers.AddAsync(server);
					await _context.SaveChangesAsync();

					if (createServerDto.Image != null && FileExtension.IsValidAvatar(createServerDto.Image))
					{
						uploadedServerImage = await _fileService.UploadServerPicture(createServerDto.Image, server.Id);
						if (uploadedServerImage == null) throw new Exception("Failed to save avatar image.");

						server.Image = uploadedServerImage;
						_context.Servers.Update(server);
						await _context.SaveChangesAsync();
					}

					await _hub
							.Clients
							.Group(ServerHub.GroupName(server.Id))
							.UserJoined(server.Id, new UserInfoDto
							{
								Id = userId.ToString()!.ToUpper(),
								Username = user.Username,
								Role = user.Role,
								Image = user.Image ?? string.Empty,
							});

					await _context.SaveChangesAsync();
					await transaction.CommitAsync();

					_logger.LogInformation("Server {ServerName} created by user {UserId}", server.Name, userId);
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();

					if(uploadedServerImage != null)
					{
						_fileService.DeleteFile(uploadedServerImage);
					}

					_logger.LogError(ex, "Error creating server {ServerName} by user {UserId}", createServerDto.Name, userId);

					return StatusCode(500, $"Error creating server: {ex.Message}");
				}
			}

			return Ok(new ServerDto
			{
				Id = server.Id.ToString().ToUpper(),
				Name = server.Name,
				Description = server.Description ?? string.Empty,
				OwnerId = server.OwnerId.ToString().ToUpper(),
				Image = server.Image ?? string.Empty,
				Members = new List<UserInfoDto>()
				{
					new ()
					{
						Id = user.Id.ToString().ToUpper(),
						Username = user.Username,
						Role = user.Role,
						Image = user.Image ?? string.Empty,
					}
				},
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> UpdateServer(Guid id, [FromForm] CreateServerDto updateServerDto, bool deleteImage = false)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var server = await _context.Servers.FindAsync(id);
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId != userId) return BadRequest("You are not the owner of this server");

			// track old image for best‑effort cleanup after DB commit
			string? oldImageToDelete = null;

			// check if user wants to delete image (deleteImage = true and no new image provided)
			if (deleteImage && !string.IsNullOrWhiteSpace(server.Image))
			{
				oldImageToDelete = server.Image;
				server.Image = "";
			}

			// check if user provided a new image (wants to change or add new)
			else if (!deleteImage && updateServerDto.Image != null && FileExtension.IsValidAvatar(updateServerDto.Image))
			{
				var uploadedImage = await _fileService.UploadServerPicture(updateServerDto.Image, server.Id);

				if (uploadedImage == null)
				{
					_logger.LogError("Failed to upload new server image for server {ServerName} by user {UserId}", server.Name, userId);
					return StatusCode(500, "Failed to save server image.");
				}

				oldImageToDelete = server.Image;
				server.Image = uploadedImage;
			}

			server.Name = updateServerDto.Name ?? server.Name;
			server.Description = updateServerDto.Description ?? "";

			await _context.SaveChangesAsync();

			if (!string.IsNullOrWhiteSpace(oldImageToDelete))
			{
			    try { _fileService.DeleteFile(oldImageToDelete); } catch { }
			}

			await _hub
					.Clients
					.Group(ServerHub.GroupName(server.Id))
					.ServerUpdated(new ServerDto
					{
						Id = server.Id.ToString().ToUpper(),
						Name = server.Name,
						Description = server.Description,
						OwnerId = server.OwnerId.ToString().ToUpper(),
						Image = server.Image ?? string.Empty,
					});

			_logger.LogInformation("Server {ServerName} updated by user {UserId}", server.Name, userId);

			return Ok(new ServerDto
			{
				Id = server.Id.ToString().ToUpper(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString().ToUpper(),
				Image = server.Image ?? string.Empty,
			});
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<List<ServerDto>>> GetServers()
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var servers = await _context.Servers
				.Where(s => s.Members.Any(u => u.Id == userId))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString().ToUpper(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString().ToUpper(),
					Image = s.Image ?? string.Empty,
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

			var server = await _context.Servers
				.AsSplitQuery()
				.AsNoTracking()
				.Where(s => s.Id == id && s.Members.Any(m => m.Id == userId))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString().ToUpper(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString().ToUpper(),
					Image = s.Image ?? string.Empty,
					Members = s.Members.Select(m => new UserInfoDto
					{
						Id = m.Id.ToString().ToUpper(),
						Username = m.Username,
						Image = m.Image ?? string.Empty,
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

			var server = await _context.Servers
				.AsSplitQuery()
				.Include(s => s.Members)
				.Include(c => c.Channels)
				.FirstOrDefaultAsync(s => s.Name == name);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId == userId) return BadRequest("You are the owner of this server");

			if (server.Members.Any(m => m.Id == userId)) return BadRequest("You are already a member of this server");

			var user = await _context.Users.FindAsync(userId);
			if (user == null) return BadRequest("User not found");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					server.Members.Add(user);
					await _context.SaveChangesAsync();

					await _hub
							.Clients
							.Group(ServerHub.GroupName(server.Id))
							.UserJoined(server.Id, new UserInfoDto
							{
								Id = userId.ToString()!.ToUpper()!,
								Username = user.Username,
								Role = user.Role,
								Image = user.Image ?? string.Empty,
							});

					await transaction.CommitAsync();

					return Ok(new ServerDto
					{
						Id = server.Id.ToString().ToUpper(),
						Name = server.Name,
						Description = server.Description,
						OwnerId = server.OwnerId.ToString().ToUpper(),
						Image = server.Image ?? string.Empty,
						Members = server.Members.Select(m => new UserInfoDto
						{
							Id = m.Id.ToString().ToUpper(),
							Username = m.Username,
							Image = m.Image ?? string.Empty,
						})
						.OrderBy(m => m.Username)
						.ToList(),
						Channels = server.Channels.Select(c => new ChannelDto
						{
							Id = c.Id.ToString().ToUpper(),
							Name = c.Name,
						})
						.OrderBy(c => c.Name)
						.ToList()
					});
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					_logger.LogError(ex, "Error joining server {ServerId} by user {UserId}", server.Id, userId);
					return StatusCode(500, $"Error joining server: {ex.Message}");
				}
			}
		}

		[HttpDelete("leave/{serverId}")]
		[Authorize]
		public async Task<ActionResult> LeaveServer(Guid serverId)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id == serverId);

			if (server == null) return NotFound("Server not found");
			if (!server.Members.Any(m => m.Id == userId)) return BadRequest("You are not a member of this server");

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
						.UserLeft(server.Id, userId.Value);

					// remove user from SignalR group
					var connectionIds = _mapper.GetConnections(userId.Value);
					foreach (var connId in connectionIds)
					{
						await _hub.Groups.RemoveFromGroupAsync(connId, ServerHub.GroupName(server.Id));
					}

					await transaction.CommitAsync();
					return Ok(new { message = "User successfully left the server" });
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					_logger.LogError(ex, "Error leaving server {ServerId} by user {UserId}", serverId, userId);
					return StatusCode(500, $"Error leaving server: {ex.Message}");
				}
			}
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteServer(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var server = await _context.Servers
				.Include(s => s.Members) // for later hub notifications
				.FirstOrDefaultAsync(s => s.Id == id && s.OwnerId == userId);

			if (server == null) return NotFound("Server not found");

			// collect file paths before deletion
			var filePaths = await _context.Attachments
				.AsNoTracking()
				.Where(a => a.ServerMessage!.Channel.ServerId == id)
				.Select(a => new { a.StoredFileName, a.PreviewName })
				.ToListAsync();

			if (!string.IsNullOrWhiteSpace(server.Image))
				filePaths.Add(new { StoredFileName = server.Image, PreviewName = (string?)null });

			using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				_context.Servers.Remove(server);
				await _context.SaveChangesAsync();

				// clean up files
				foreach (var file in filePaths)
				{
					if (file.PreviewName != null) _fileService.DeleteFile(file.PreviewName);
					if (file.StoredFileName != null) _fileService.DeleteFile(file.StoredFileName);
				}

				await transaction.CommitAsync();

				// notify clients
				foreach (var member in server.Members)
				{
					await _hub.Clients.Group(ServerHub.GroupName(server.Id))
						.UserLeft(server.Id, member.Id);

					var connectionIds = _mapper.GetConnections(member.Id);
					foreach (var connId in connectionIds)
						await _hub.Groups.RemoveFromGroupAsync(connId, ServerHub.GroupName(server.Id));
				}

				_logger.LogInformation("Server {ServerId} deleted by user {UserId}", id, userId);

				return Ok(new { message = "Server deleted successfully" });
			}
			catch (Exception ex)
			{
				await transaction.RollbackAsync();
				_logger.LogError(ex, "Error deleting server {ServerId} by user {UserId}", id, userId);
				return StatusCode(500, $"Error deleting server: {ex.Message}");
			}
		}

		[HttpDelete("kick/{serverId}/{userId}")]
		[Authorize]
		public async Task<ActionResult> KickUser(Guid serverId, Guid userId)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var ownerId = User.GetUserId();
			if (ownerId == null) return BadRequest("User not found");

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id == serverId && s.OwnerId == ownerId && s.Members.Any(m => m.Id == userId));
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

					// forcefully remove user from the SignalR group
					var connectionIds = _mapper.GetConnections(userId);
					foreach (var connId in connectionIds)
					{
						await _hub.Groups.RemoveFromGroupAsync(connId, ServerHub.GroupName(server.Id));
					}

					await transaction.CommitAsync();

					return Ok(new { message = "User kicked from server" });
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					_logger.LogError(ex, "Error kicking user {KickedUserId} from server {ServerId} by owner {OwnerId}", userId, serverId, ownerId);
					return StatusCode(500, $"Error kicking user: {ex.Message}");
				}
			}
		}
	}
}
