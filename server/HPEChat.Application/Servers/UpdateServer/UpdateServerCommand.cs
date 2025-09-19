using HPEChat.Application.Servers.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Servers.UpdateServer
{
	public class UpdateServerCommand : IRequest<ServerDto>
	{
		public Guid ServerId { get; set; }
		public Guid OwnerId { get; set; }
		public string? Name { get; set; }
		public string? Description { get; set; }
		public IFormFile? Image { get; set; }
		public bool DeleteImage { get; set; } = false;
	}
}
