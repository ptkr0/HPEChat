using HPEChat.Application.Users.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace HPEChat.Application.Users.RegisterUser
{
	public class RegisterUserCommand : IRequest<UserInfoDto>
	{
		public string Username { get; set; } = string.Empty;
		public string Password { get; set; } = string.Empty;
		public IFormFile? Image { get; set; }
	}
}
