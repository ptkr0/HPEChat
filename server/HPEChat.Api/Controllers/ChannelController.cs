using HPEChat.Application.Channels.CreateChannel;
using HPEChat.Application.Channels.DeleteChannel;
using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Common.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ChannelController : ControllerBase
	{
		private readonly IMediator _mediator;
		public ChannelController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> CreateChannel([FromBody] CreateChannelDto createChannelDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var command = new CreateChannelCommand
			{
				Name = createChannelDto.Name,
				ServerId = createChannelDto.ServerId,
				UserId = userId.Value
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> UpdateChannel(Guid id, [FromBody] string name)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var command = new CreateChannelCommand
			{
				ServerId = id,
				Name = name,
				UserId = userId.Value
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var command = new DeleteChannelCommand
			{
				ChannelId = id,
				UserId = userId.Value
			};

			await _mediator.Send(command);

			return Ok(new { message = "Channel deleted successfully" });
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ChannelDto>> GetChannel(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			return NoContent();
		}
	}
}
