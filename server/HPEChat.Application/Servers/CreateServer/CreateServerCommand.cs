using HPEChat.Application.Servers.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace HPEChat.Application.Servers.CreateServer
{
	public class CreateServerCommand : IRequest<ServerDto>
	{
		public Guid UserId { get; set; }
		public string Name { get; set; } = string.Empty;
		public string? Description { get; set; } = string.Empty;

		public IFormFile? Image { get; set; }
	}
}
