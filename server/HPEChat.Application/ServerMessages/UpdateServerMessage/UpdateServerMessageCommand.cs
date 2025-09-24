using HPEChat.Application.ServerMessages.Dtos;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.ServerMessages.UpdateServerMessage
{
	public class UpdateServerMessageCommand : IRequest<ServerMessageDto>
	{
		public Guid MessageId { get; set; }
		public Guid UserId { get; set; }
		public string NewMessage { get; set; } = string.Empty;
	}
}
