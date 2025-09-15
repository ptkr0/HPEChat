
using HPEChat.Application.Channels.Dtos;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Channels.CreateChannel
{
	public class CreateChannelCommand : IRequest<ChannelDto>
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
		public string Name { get; set; } = string.Empty;
	}
}
