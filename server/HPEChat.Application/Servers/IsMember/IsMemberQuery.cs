using MediatR;

namespace HPEChat.Application.Servers.IsMember
{
	public class IsMemberQuery : IRequest<bool>
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
	}
}
