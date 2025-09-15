using MediatR;

namespace HPEChat.Application.Servers.DeleteServer
{
	internal class DeleteServerCommand : IRequest
	{
		public Guid ServerId { get; set; }
		public Guid OwnerId { get; set; }
	}
}
