using HPEChat.Application.Users.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Common.Interfaces.Hubs
{
	public interface IUserClient
	{
		Task UsernameChanged(UserInfoDto user);
		Task AvatarChanged(UserInfoDto user);
	}
}
