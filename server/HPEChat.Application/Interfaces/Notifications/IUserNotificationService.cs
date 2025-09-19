using HPEChat.Application.Users.Dtos;

namespace HPEChat.Application.Interfaces.Notifications
{
	public interface IUserNotificationService
	{
		Task NotifyUsernameChanged(UserInfoDto user);
		Task NotifyImageChanged(UserInfoDto user);
	}
}
