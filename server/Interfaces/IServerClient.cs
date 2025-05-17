using HPEChat_Server.Dtos.User;

namespace HPEChat_Server.Interfaces
{
	public interface IServerClient
	{
		Task UserJoined(Guid serverId, UserInfoDto user);
		Task UserLeft(Guid serverId, Guid userId);

		Task ChannelAdded(Guid serverId, Guid channelId);
		Task ChannelRemoved(Guid serverId, Guid channelId);
		Task ChannelUpdated(Guid serverId, Guid channelId);

		Task MessageAdded(Guid serverId, Guid channelId, Guid messageId);
	}
}
