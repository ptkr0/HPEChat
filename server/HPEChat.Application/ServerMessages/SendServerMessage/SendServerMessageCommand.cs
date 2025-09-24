using HPEChat.Application.ServerMessages.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace HPEChat.Application.ServerMessages.SendServerMessage
{
	public class SendServerMessageCommand : IRequest<ServerMessageDto>
	{
		public Guid ChannelId { get; set; }
		public Guid UserId { get; set; }
		public string? Message { get; set; }
		public IFormFile? Attachment { get; set; }
	}
}
