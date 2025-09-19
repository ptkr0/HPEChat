using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Channels.DeleteChannel
{
	public class DeleteChannelCommand : IRequest
	{
		public Guid ChannelId { get; set; }
		public Guid UserId { get; set; }
	}
}
