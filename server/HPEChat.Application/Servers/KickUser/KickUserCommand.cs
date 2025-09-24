using MediatR;

namespace HPEChat.Application.Servers.KickUser
{
	internal class KickUserCommand : IRequest
	{
		public Guid ServerId { get; set; }
		public Guid KickerId { get; set; }
		public Guid KickeeId { get; set; }
	}
}
