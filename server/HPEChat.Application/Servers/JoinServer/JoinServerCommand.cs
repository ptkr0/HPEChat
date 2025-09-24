using HPEChat.Application.Servers.Dtos;
using MediatR;

namespace HPEChat.Application.Servers.JoinServer
{
	public class JoinServerCommand : IRequest<ServerDto>
	{
		public string Name { get; set; } = string.Empty;
		public Guid UserId { get; set; }
	}
}
