using HPEChat.Application.Servers.Dtos;
using MediatR;

namespace HPEChat.Application.Servers.GetServers
{
	public class GetServersQuery : IRequest<ICollection<ServerDto>>
	{
		public Guid UserId { get; set; }
	}
}
