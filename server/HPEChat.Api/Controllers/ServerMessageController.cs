using HPEChat.Application.Common.Extensions;
using HPEChat.Application.ServerMessages.DeleteServerMessage;
using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.ServerMessages.GetServerMessages;
using HPEChat.Application.ServerMessages.SendServerMessage;
using HPEChat.Application.ServerMessages.UpdateServerMessage;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerMessageController : ControllerBase
	{
		private readonly IMediator _mediator;
		public ServerMessageController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<ICollection<ServerMessageDto>>> GetMessages([FromQuery] GetServerMessagesDto getMessages)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var query = new GetServerMessagesQuery
			{
				ChannelId = getMessages.ChannelId,
				UserId = userId.Value,
				Before = getMessages.LastCreatedAt,
				PageSize = 50
			};

			var messages = await _mediator.Send(query);

			return Ok(messages);
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> SendMessageAttachment([FromForm] SendServerMessageWithAttachmentDto messageDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			// user can send message without attachment or attachment without message
			// but message and attachment cannot both be null or empty
			if (string.IsNullOrWhiteSpace(messageDto.Message) && messageDto.Attachment == null)
				return BadRequest("Message and attachment cannot both be null or empty.");

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new SendServerMessageCommand
			{
				ChannelId = messageDto.ChannelId,
				UserId = userId.Value,
				Message = messageDto.Message,
				Attachment = messageDto.Attachment
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> EditMessage(Guid id, [FromBody][MaxLength(2000)] string message)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new UpdateServerMessageCommand
			{
				MessageId = id,
				UserId = userId.Value,
				NewMessage = message
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteMessage(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new DeleteServerMessageCommand
			{
				MessageId = id,
				UserId = userId.Value
			};

			await _mediator.Send(command);

			return Ok(new { message = "Message deleted successfully" });
		}
	}
}
