using HPEChat.Application.Users.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.ChangeImage
{
	public class ChangeImageCommand : IRequest<UserInfoDto>
	{
		public Guid UserId { get; set; }
		public IFormFile? Image { get; set; }
	}
}
