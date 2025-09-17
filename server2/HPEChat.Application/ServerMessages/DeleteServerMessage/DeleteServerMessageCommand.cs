using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.ServerMessages.DeleteServerMessage
{
	internal class DeleteServerMessageCommand : IRequest
	{
		public Guid MessageId { get; set; }
		public Guid UserId { get; set; }
	}
}
