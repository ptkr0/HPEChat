using MediatR;

namespace HPEChat.Application.Servers.DeleteServer
{
	public class DeleteServerCommand : IRequest
	{
		public Guid ServerId { get; set; }
		public Guid OwnerId { get; set; }
	}
}
