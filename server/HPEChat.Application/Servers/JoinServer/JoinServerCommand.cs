using HPEChat.Application.Servers.Dtos;
using MediatR;

namespace HPEChat.Application.Servers.JoinServer
{
	public class JoinServerCommand : IRequest<ServerDto>
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
	}
}
