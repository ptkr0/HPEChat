using HPEChat_Server.Data;
using HPEChat_Server.Dtos.ServerMessage;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerMessageController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		public ServerMessageController(ApplicationDBContext context)
		{
			_context = context;
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<ICollection<ServerMessageDto>>> GetMessages([FromQuery] GetServerMessagesDto messagesDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid channelGuid = messagesDto.ChannelId;
			DateTimeOffset? lastCreatedAt = messagesDto.LastCreatedAt;
			Guid userGuid = Guid.Parse(userId);
			int pageSize = 20;

			var query = _context.ServerMessages
				.Where(m =>
					m.ChannelId == channelGuid && // only messages from the specified channel  
					m.Channel.Server.Members.Any(mem => mem.Id == userGuid)); // only messages from channels the user is a member of  

			if (lastCreatedAt.HasValue) query = query.Where(m => m.SentAt < lastCreatedAt.Value); // only messages sent before the last loaded message  

			var messages = await query
				.OrderByDescending(m => m.SentAt)
				.ThenByDescending(m => m.Id)
				.Select(m => new ServerMessageDto
				{
					Id = m.Id.ToString().ToUpper(),
					ChannelId = m.ChannelId.ToString().ToUpper(),
					SenderId = m.SenderId.HasValue ? m.SenderId.Value.ToString().ToUpper() : string.Empty,
					SenderName = m.Sender != null ? m.Sender.Username : string.Empty,
					Message = m.Message,
					SentAt = m.SentAt,
					IsEdited = m.IsEdited,
				})
				.Take(pageSize)
				.ToListAsync();

			return Ok(messages);
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> SendMessage([FromBody] SendServerMessageDto messageDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var username = User.GetUsername();
			if (username == null) return BadRequest("Username not found");

			Guid channelGuid = messageDto.ChannelId;
			Guid userGuid = Guid.Parse(userId);

			var channel = await _context.Channels
				.FirstOrDefaultAsync(c => c.Id == channelGuid && c.Server.Members.Any(m => m.Id == userGuid));
			if (channel == null) return NotFound("Channel not found or you are not a member of the server");

			var message = new ServerMessage
			{
				ChannelId = channelGuid,
				SenderId = userGuid,
				Message = messageDto.Message,
				SentAt = DateTimeOffset.UtcNow,
				IsEdited = false,
			};

			await _context.ServerMessages.AddAsync(message);
			await _context.SaveChangesAsync();

			return Ok(new ServerMessageDto
			{
				Id = message.Id.ToString().ToUpper(),
				ChannelId = message.ChannelId.ToString().ToUpper(),
				SenderId = message.SenderId.HasValue ? message.SenderId.Value.ToString().ToUpper() : string.Empty,
				SenderName = username,
				Message = message.Message,
				SentAt = message.SentAt,
				IsEdited = message.IsEdited,
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> EditMessage([Required]Guid id, [FromBody][Required][MaxLength(2000)] string message)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid messageGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var serverMessage = await _context.ServerMessages
				.FirstOrDefaultAsync(m =>
					m.Id == messageGuid && // check if message exists
					m.SenderId == userGuid && // check if the user is the sender
					m.Channel.Server.Members.Any(u => u.Id == userGuid)); // check if the user is still a member of the server
			if (serverMessage == null) return NotFound("Message not found or you are not the sender");

			serverMessage.Message = message;
			serverMessage.IsEdited = true;
			await _context.SaveChangesAsync();

			return Ok(new ServerMessageDto
			{
				Id = serverMessage.Id.ToString(),
				ChannelId = serverMessage.ChannelId.ToString(),
				SenderId = serverMessage.SenderId.HasValue ? serverMessage.SenderId.Value.ToString() : string.Empty,
				SenderName = serverMessage.Sender != null ? serverMessage.Sender.Username : string.Empty,
				Message = serverMessage.Message,
				SentAt = serverMessage.SentAt,
				IsEdited = serverMessage.IsEdited,
			});
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteMessage(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			Guid messageGuid = id;
			Guid userGuid = Guid.Parse(userId);

			var serverMessage = await _context.ServerMessages
				.FirstOrDefaultAsync(m =>
					m.Id == messageGuid && // check if message exists
					m.SenderId == userGuid && // check if the user is the sender
					m.Channel.Server.Members.Any(u => u.Id == userGuid)); // check if the user is still a member of the server
			if (serverMessage == null) return NotFound("Message not found or you are not the sender");

			_context.ServerMessages.Remove(serverMessage);
			await _context.SaveChangesAsync();

			return Ok(new { message = "Message deleted successfully" });
		}
	}
}
