using HPEChat.Application.Common.Interfaces.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HPEChat.Api.Hubs
{
	public interface IUserHub
	{
	}

	[Authorize]
	public class UserHub : Hub<IUserClient>, IUserHub
	{
		public override async Task OnConnectedAsync()
		{
			await base.OnConnectedAsync();
		}
	}
}
