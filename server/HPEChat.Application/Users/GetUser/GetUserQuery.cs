using HPEChat.Application.Users.Dtos;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.GetUser
{
	public class GetUserQuery : IRequest<UserInfoDto>
	{
		public Guid UserId { get; set; }
	}
}
