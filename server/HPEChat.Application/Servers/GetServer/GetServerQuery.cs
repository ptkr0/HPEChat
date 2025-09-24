using HPEChat.Application.Servers.Dtos;
using MediatR;

namespace HPEChat.Application.Servers.GetServer
{
	public class GetServerQuery : IRequest<ServerDto>
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
	}
}
