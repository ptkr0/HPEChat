using MediatR;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.Servers.DeleteServer
{
	internal class DeleteServerCommand : IRequest
	{
		[Required]
		public Guid ServerId { get; set; }

		[Required]
		public Guid OwnerId { get; set; }
	}
}
