using HPEChat_Server.Dtos.ServerMessage;
using HPEChat_Server.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace HPEChat_Server.Hubs
{
	public class ServerHub : Hub<IServerClient>, IServerHub
	{
		public static string GroupName(Guid serverId) => $"server:{serverId:D}";

		public override async Task OnDisconnectedAsync(Exception? ex)
		{
			await base.OnDisconnectedAsync(ex);
		}

		public Task AddChannel(Guid serverId, string channelName)
		{
			throw new NotImplementedException();
		}

		public async Task JoinServer(Guid serverId)
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(serverId));
		}

		public Task LeaveServer(Guid serverId)
		{
			throw new NotImplementedException();
		}

		public Task RemoveChannel(Guid serverId, Guid channelId)
		{
			throw new NotImplementedException();
		}

		public Task SendMessage(Guid serverId, SendServerMessageDto message)
		{
			throw new NotImplementedException();
		}

		public Task UpdateChannel(Guid serverId, Guid channelId, string channelName)
		{
			throw new NotImplementedException();
		}
	}
}
