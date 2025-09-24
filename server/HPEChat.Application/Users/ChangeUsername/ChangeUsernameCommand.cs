using HPEChat.Application.Users.Dtos;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.ChangeUsername
{
	public class ChangeUsernameCommand : IRequest<UserInfoDto>
	{
		public Guid UserId { get; set; }
		public string NewUsername { get; set; } = string.Empty;
	}
}
