using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Extensions;
using HPEChat_Server.Hubs;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ChannelController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		private readonly IHubContext<ServerHub, IServerClient> _hub;
		private readonly FileService _fileService;
		public ChannelController(ApplicationDBContext context, IHubContext<ServerHub, IServerClient> hub, FileService fileService)
		{
			_context = context;
			_hub = hub;
			_fileService = fileService;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> CreateChannel([FromBody] CreateChannelDto createChannelDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid serverGuid = createChannelDto.ServerId;

			var server = await _context.Servers.FindAsync(serverGuid);
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId != userId) return Unauthorized("You are not the owner of this server");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					var channel = new Channel
					{
						Name = createChannelDto.Name,
						ServerId = createChannelDto.ServerId,
					};

					await _context.Channels.AddAsync(channel);
					await _context.SaveChangesAsync();

					await _hub
							.Clients
							.Group(ServerHub.GroupName(serverGuid))
							.ChannelAdded(serverGuid, new ChannelDto
							{
								Id = channel.Id.ToString().ToUpper(),
								Name = channel.Name,
							});

					await transaction.CommitAsync();

					return Ok(new ChannelDto
					{
						Id = channel.Id.ToString().ToUpper(),
						Name = channel.Name,
					});
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					return BadRequest($"Error creating channel: {ex.Message}");
				}
			}
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> UpdateChannel(Guid id, [FromBody][Required] string name)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var channel = await _context.Channels
				.FirstOrDefaultAsync(c => c.Id == id && c.Server.OwnerId == userId);

			if (channel == null) return NotFound("Channel not found or access denied");
			if (channel.Name == name) return BadRequest("Channel name is the same");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					channel.Name = name;
					_context.Channels.Update(channel);
					await _context.SaveChangesAsync();

					await _hub
						.Clients
						.Group(ServerHub.GroupName(channel.ServerId))
						.ChannelUpdated(channel.ServerId, new ChannelDto
						{
							Id = channel.Id.ToString().ToUpper(),
							Name = name,
						});

					await transaction.CommitAsync();

					return Ok(new ChannelDto
					{
						Id = channel.Id.ToString().ToUpper(),
						Name = channel.Name,
					});
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					return BadRequest($"Error updating channel: {ex.Message}");
				}
			}
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			// channel to delete
			var channel = await _context.Channels
				.FirstOrDefaultAsync(c => c.Id == id && c.Server.OwnerId == userId);

			if (channel == null) return NotFound("Channel not found or access denied");

			// attachments that were sent on the channel
			var filePaths = await _context.Attachments
				.AsNoTracking()
				.Where(a => a.ServerMessage!.ChannelId == id)
				.Select(a => new { a.StoredFileName, a.PreviewName })
				.ToListAsync();

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					_context.Channels.Remove(channel);
					await _context.SaveChangesAsync();

					foreach (var file in filePaths)
					{
						if (file.PreviewName != null) _fileService.DeleteFile(file.PreviewName);
						if (file.StoredFileName != null) _fileService.DeleteFile(file.StoredFileName);
					}

					await transaction.CommitAsync();

					await _hub
						.Clients
						.Group(ServerHub.GroupName(channel.ServerId))
						.ChannelRemoved(channel.ServerId, channel.Id);

					return Ok(new { message = "Server deleted successfully" });
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					return StatusCode(500, $"Error deleting channel: {ex.Message}");
				}
			}
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> GetChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid channelGuid = id;

			var channel = await _context.Channels
			.FirstOrDefaultAsync(c => c.Id == channelGuid && c.Server.Members.Any(m => m.Id == userId));

			if (channel == null) return NotFound("Channel not found or access denied");

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString().ToUpper(),
				Name = channel.Name,
			});
		}
	}
}
