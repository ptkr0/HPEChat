using HPEChat.Application.Users.Dtos;

namespace HPEChat.Application.Common.Interfaces.Notifications
{
	public interface IUserNotificationService
	{
		Task NotifyUsernameChanged(UserInfoDto user);
		Task NotifyImageChanged(UserInfoDto user);
	}
}
