using HPEChat.Application.Servers.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.Servers.CreateServer
{
	public class CreateServerCommand : IRequest<ServerDto>
	{
		[Required]
		public Guid UserId { get; set; }

		[Required]
		[MaxLength(50)]
		public string Name { get; set; } = string.Empty;

		[MaxLength(1000)]
		public string? Description { get; set; } = string.Empty;

		public IFormFile? Image { get; set; }
	}
}
