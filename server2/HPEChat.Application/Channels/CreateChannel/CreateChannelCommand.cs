
using HPEChat.Application.Channels.Dtos;
using MediatR;

namespace HPEChat.Application.Channels.CreateChannel
{
	public class CreateChannelCommand : IRequest<ChannelDto>
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
		public string Name { get; set; } = string.Empty;
	}
}
