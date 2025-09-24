using HPEChat.Infrastructure.Data;
using HPEChat.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using HPEChat.Application.Common.Interfaces.Hubs;
using MediatR;
using HPEChat.Application.Servers.IsMember;

namespace HPEChat.Api.Hubs
{
	public interface IServerHub
	{
		Task JoinServer(Guid serverId);
	}

	[Authorize]
	public class ServerHub : Hub<IServerClient>, IServerHub
	{
		private readonly IMediator _mediator;
		private readonly ConnectionMapperService _mapper;

		public ServerHub(IMediator mediator, ConnectionMapperService mapper)
		{
			_mediator = mediator;
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
				var command = new IsMemberQuery
				{
					ServerId = serverId,
					UserId = userId
				};

				bool isMember = await _mediator.Send(command);

				if (!isMember)
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

			var command = new IsMemberQuery
			{
				ServerId = serverId,
				UserId = userId
			};

			bool isMember = await _mediator.Send(command);

			if (!isMember) throw new Exception("User is not a member of the server");

			await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(serverId));
		}
	}
}
