using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

			var server = await _context.Servers.FindAsync(Guid.Parse(createChannelDto.ServerId));
			if (server == null || server.OwnerId.ToString() != userId) return NotFound("Server not found");

			var channel = new Channel
			{
				Name = createChannelDto.Name,
				ServerId = Guid.Parse(createChannelDto.ServerId),
			};

			await _context.Channels.AddAsync(channel);
			await _context.SaveChangesAsync();

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString(),
				Name = channel.Name,
			});
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> GetChannel(string id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var channel = await _context.Channels.FindAsync(Guid.Parse(id));
			if (channel == null) return NotFound("Channel not found");

			return Ok(new ChannelDto
			{
				Id = channel.Id.ToString(),
				Name = channel.Name,
			});
		}
	}
}
