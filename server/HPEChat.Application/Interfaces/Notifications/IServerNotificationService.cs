using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;

namespace HPEChat.Application.Interfaces.Notifications
{
	public interface IServerNotificationService
	{
		Task NotifyServerUpdated(Guid serverId, ServerDto server);
		Task NotifyUserJoined(Guid serverId, UserInfoDto user);
		Task NotifyUserLeft(Guid serverId, Guid userId);
		Task NotifyChannelAdded(Guid serverId, ChannelDto channel);
		Task NotifyChannelRemoved(Guid serverId, Guid channelId);
		Task NotifyChannelUpdated(Guid serverId, ChannelDto channel);
		Task NotifyMessageAdded(Guid serverId, ServerMessageDto message);
		Task NotifyMessageEdited(Guid serverId, ServerMessageDto message);
		Task NotifyMessageRemoved(Guid serverId, Guid channelId, Guid messageId);
		Task RemoveUserFromGroup(Guid userId, Guid serverId);
	}
}
