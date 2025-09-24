using HPEChat.Application.ServerMessages.Dtos;
using MediatR;

namespace HPEChat.Application.ServerMessages.GetServerMessages
{
	public class GetServerMessagesQuery : IRequest<ICollection<ServerMessageDto>>
	{
		public Guid ChannelId { get; set; }
		public Guid UserId { get; set; }
		public int PageSize { get; set; } = 50;
		public DateTimeOffset? Before { get; set; }
	}
}
