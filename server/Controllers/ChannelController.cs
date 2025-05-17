using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ChannelController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		public ChannelController(ApplicationDBContext context)
		{
			_context = context;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> CreateChannel([FromBody] CreateChannelDto createChannelDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid userGuid = Guid.Parse(userId);
			Guid serverGuid = createChannelDto.ServerId;

			var server = await _context.Servers.FindAsync(serverGuid);
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId != userGuid) return Unauthorized("You are not the owner of this server");

			var channel = new Channel
			{
				Name = createChannelDto.Name,
				ServerId = createChannelDto.ServerId,
			};

			await _context.Channels.AddAsync(channel);
			await _context.SaveChangesAsync();

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString().ToUpper(),
				Name = channel.Name,
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> UpdateChannel(Guid id, [FromBody] string name)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid channelGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var channel = await _context.Channels
				.FirstOrDefaultAsync(c => c.Id == channelGuid && c.Server.OwnerId == userGuid);

			if (channel == null) return NotFound("Channel not found or access denied");

			channel.Name = name;

			await _context.SaveChangesAsync();

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString().ToUpper(),
				Name = channel.Name,
			});
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid channelGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var channel = await _context.Channels
				.FirstOrDefaultAsync(c => c.Id == channelGuid && c.Server.OwnerId == userGuid);

			if (channel == null) return NotFound("Channel not found or access denied");

			_context.Channels.Remove(channel);

			await _context.SaveChangesAsync();

			return Ok(new { message = "Server deleted successfully" });
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> GetChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			Guid channelGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var channel = await _context.Channels
			.FirstOrDefaultAsync(c => c.Id == channelGuid && c.Server.Members.Any(m => m.Id == userGuid));

			if (channel == null) return NotFound("Channel not found or access denied");

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString().ToUpper(),
				Name = channel.Name,
			});
		}
	}
}
