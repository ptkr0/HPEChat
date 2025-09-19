using HPEChat.Application.Interfaces.Hubs;
using HPEChat.Application.Users.Dtos;
using HPEChat.Infrastructure.Data;
using HPEChat.Infrastructure.Services;
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
		private readonly ApplicationDBContext _context;
		private readonly ConnectionMapperService _mapper;

		public UserHub(ApplicationDBContext context, ConnectionMapperService mapper)
		{
			_context = context;
			_mapper = mapper;
		}

		public override async Task OnConnectedAsync()
		{
			await base.OnConnectedAsync();
		}
	}
}
