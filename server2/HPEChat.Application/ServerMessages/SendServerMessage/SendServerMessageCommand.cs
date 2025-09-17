using HPEChat.Application.ServerMessages.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.ServerMessages.SendServerMessage
{
	internal class SendServerMessageCommand : IRequest<ServerMessageDto>
	{
		public Guid ChannelId { get; set; }
		public Guid UserId { get; set; }
		public string? Message { get; set; }
		public IFormFile? Attachment { get; set; }
	}
}
