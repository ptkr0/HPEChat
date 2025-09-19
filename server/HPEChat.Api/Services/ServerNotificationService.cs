using Azure.Core;
using HPEChat.Api.Hubs;
using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Interfaces.Hubs;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Infrastructure.Services;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Channels;

namespace HPEChat.Api.Services
{
	internal class ServerNotificationService : IServerNotificationService
	{
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		private readonly ConnectionMapperService _connectionMapperService;
		public ServerNotificationService(
			IHubContext<ServerHub, IServerClient> serverHub,
			ConnectionMapperService connectionMapperService)
		{
			_serverHub = serverHub;
			_connectionMapperService = connectionMapperService;
		}
		public async Task NotifyChannelAdded(Guid serverId, ChannelDto channel)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.ChannelAdded(serverId, channel);
		}

		public async Task NotifyChannelRemoved(Guid serverId, Guid channelId)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.ChannelRemoved(serverId, channelId);
		}

		public async Task NotifyChannelUpdated(Guid serverId, ChannelDto channel)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.ChannelUpdated(serverId, channel);
		}

		public async Task NotifyMessageAdded(Guid serverId, ServerMessageDto message)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.MessageAdded(serverId, message);
		}

		public async Task NotifyMessageEdited(Guid serverId, ServerMessageDto message)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.MessageEdited(serverId, message);
		}

		public async Task NotifyMessageRemoved(Guid serverId, Guid channelId, Guid messageId)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.MessageRemoved(serverId, channelId, messageId);
		}

		public async Task NotifyServerUpdated(Guid serverId, ServerDto server)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(server.Id))
					.ServerUpdated(server);
		}

		public async Task NotifyUserJoined(Guid serverId, UserInfoDto user)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.UserJoined(serverId, user);
		}

		public async Task NotifyUserLeft(Guid serverId, Guid userId)
		{
			await _serverHub
					.Clients
					.Group(ServerHub.GroupName(serverId))
					.UserLeft(serverId, userId);
		}

		public async Task RemoveUserFromGroup(Guid userId, Guid serverId)
		{
			var connectionIds = _connectionMapperService.GetConnections(userId);
			foreach (var connectionId in connectionIds)
			{
				await _serverHub.Groups.RemoveFromGroupAsync(connectionId, ServerHub.GroupName(serverId));
			}
		}
	}
}
