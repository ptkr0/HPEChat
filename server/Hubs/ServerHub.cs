using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.ServerMessage;
using HPEChat_Server.Dtos.User;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Hubs
{
	public interface IServerHub
	{
		Task JoinServer(Guid serverId);
		Task LeaveServer(Guid serverId);

		Task AddChannel(Guid serverId, ChannelDto channel);
		Task UpdateChannel(Guid serverId, ChannelDto channel);
		Task RemoveChannel(Guid serverId, Guid channelId);

		Task SendMessage(Guid serverId, ServerMessageDto message);
		Task EditMessage(Guid serverId, ServerMessageDto message);
		Task RemoveMessage(Guid serverId, Guid channelId, Guid messageId);
	}

	public interface IServerClient
	{
		Task UserJoined(Guid serverId, UserInfoDto user);
		Task UserLeft(Guid serverId, Guid userId);

		Task ChannelAdded(Guid serverId, ChannelDto channel);
		Task ChannelRemoved(Guid serverId, Guid channelId);
		Task ChannelUpdated(Guid serverId, ChannelDto channel);

		Task MessageAdded(Guid serverId, ServerMessageDto message);
		Task MessageEdited(Guid serverId, ServerMessageDto message);
		Task MessageRemoved(Guid serverId, Guid channelId, Guid messageId);
	}

	public class ServerHub : Hub<IServerClient>, IServerHub
	{
		private readonly ApplicationDBContext _context;

		public ServerHub(ApplicationDBContext context)
		{
			_context = context;
		}

		public static string GroupName(Guid serverId) => $"server:{serverId:D}".ToUpper();

		public override async Task OnConnectedAsync()
		{
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? ex)
		{
			await base.OnDisconnectedAsync(ex);
		}

		public async Task AddChannel(Guid serverId, ChannelDto channel)
		{
			await Clients.Group(GroupName(serverId)).ChannelAdded(serverId, channel);
		}

		public async Task JoinServer(Guid serverId)
		{
			// check if user is a member of the server
			var userId = Context.UserIdentifier;
			if (userId == null) throw new Exception("User not found");

			var userGuid = Guid.Parse(userId);
			bool isMember = await _context.Servers
				.AnyAsync(s => s.Id == serverId && s.Members.Any(u => u.Id == userGuid));

			if (!isMember) throw new Exception("User is not a member of the server");

			await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(serverId));
		}

		public async Task LeaveServer(Guid serverId)
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(serverId));
		}

		public async Task RemoveChannel(Guid serverId, Guid channelId)
		{
			await Clients.Group(GroupName(serverId)).ChannelRemoved(serverId, channelId);
		}

		public async Task SendMessage(Guid serverId, ServerMessageDto message)
		{
			await Clients.Group(GroupName(serverId)).MessageAdded(serverId, message);
		}

		public async Task UpdateChannel(Guid serverId, ChannelDto channel)
		{
			await Clients.Group(GroupName(serverId)).ChannelUpdated(serverId, channel);
		}

		public async Task EditMessage(Guid serverId, ServerMessageDto message)
		{
			await Clients.Group(GroupName(serverId)).MessageEdited(serverId, message);
		}

		public async Task RemoveMessage(Guid serverId, Guid channelId, Guid messageId)
		{
			await Clients.Group(GroupName(serverId)).MessageRemoved(serverId, channelId, messageId);
		}
	}
}
