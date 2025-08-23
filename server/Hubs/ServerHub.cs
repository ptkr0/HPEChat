using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.ServerMessage;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Hubs
{
	public interface IServerHub
	{
		Task JoinServer(Guid serverId);
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

	[Authorize]
	public class ServerHub : Hub<IServerClient>, IServerHub
	{
		private readonly ApplicationDBContext _context;
		private readonly ConnectionMapperService _mapper;

		public ServerHub(ApplicationDBContext context, ConnectionMapperService mapper)
		{
			_context = context;
			_mapper = mapper;
		}

		public static string GroupName(Guid serverId) => $"server:{serverId:D}".ToUpper();

		public override async Task OnConnectedAsync()
		{
			var userId = Guid.Parse(Context.UserIdentifier!);
			_mapper.Add(userId, Context.ConnectionId);

			var http = Context.GetHttpContext()!;
			if (Guid.TryParse(http.Request.Query["serverId"], out var serverId))
			{
				if (!await _context.Servers.AnyAsync(s => s.Id == serverId && s.Members.Any(u => u.Id == userId)))
				{
					// kick unauthorized users immediately
					Context.Abort();
					return;
				}
				await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(serverId));
			}
			await base.OnConnectedAsync();
		}

		public override async Task OnDisconnectedAsync(Exception? ex)
		{
			var userId = Guid.Parse(Context.UserIdentifier!);
			_mapper.Remove(userId, Context.ConnectionId);
			await base.OnDisconnectedAsync(ex);
		}

		public async Task JoinServer(Guid serverId)
		{
			// check if user is a member of the server
			var userId = Guid.Parse(Context.UserIdentifier!);
			bool isMember = await _context.Servers
				.AnyAsync(s => s.Id == serverId && s.Members.Any(u => u.Id == userId));

			if (!isMember) throw new Exception("User is not a member of the server");

			await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(serverId));
		}
	}
}
