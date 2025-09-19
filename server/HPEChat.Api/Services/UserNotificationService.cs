using HPEChat.Api.Hubs;
using HPEChat.Application.Interfaces.Hubs;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.Users.Dtos;
using Microsoft.AspNetCore.SignalR;

namespace HPEChat.Api.Services
{
	public class UserNotificationService : IUserNotificationService
	{
		private readonly IHubContext<UserHub, IUserClient> _userHub;
		public UserNotificationService(IHubContext<UserHub, IUserClient> userHub)
		{
			_userHub = userHub;
		}
		public async Task NotifyImageChanged(UserInfoDto user)
		{
			await _userHub
					.Clients
					.All
					.AvatarChanged(user);
		}

		public async Task NotifyUsernameChanged(UserInfoDto user)
		{
			await _userHub
					.Clients
					.All
					.UsernameChanged(user);
		}
	}
}
