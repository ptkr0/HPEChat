using HPEChat_Server.Dtos.ServerMessage;

namespace HPEChat_Server.Interfaces
{
	public interface IServerHub
	{
		Task JoinServer(Guid serverId);
		Task LeaveServer(Guid serverId);

		Task AddChannel(Guid serverId, string channelName);
		Task UpdateChannel(Guid serverId, Guid channelId, string channelName);
		Task RemoveChannel(Guid serverId, Guid channelId);

		Task SendMessage(Guid serverId, SendServerMessageDto message);
	}
}
