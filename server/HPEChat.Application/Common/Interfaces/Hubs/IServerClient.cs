using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;

namespace HPEChat.Application.Common.Interfaces.Hubs
{
	public interface IServerClient
	{
		Task ServerUpdated(ServerDto server);
		Task UserJoined(Guid serverId, UserInfoDto user);
		Task UserLeft(Guid serverId, Guid userId);

		Task ChannelAdded(Guid serverId, ChannelDto channel);
		Task ChannelRemoved(Guid serverId, Guid channelId);
		Task ChannelUpdated(Guid serverId, ChannelDto channel);

		Task MessageAdded(Guid serverId, ServerMessageDto message);
		Task MessageEdited(Guid serverId, ServerMessageDto message);
		Task MessageRemoved(Guid serverId, Guid channelId, Guid messageId);
	}
}
