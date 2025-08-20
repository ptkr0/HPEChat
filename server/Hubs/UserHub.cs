using HPEChat_Server.Data;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HPEChat_Server.Hubs
{
	public interface IUserHub
	{
	}

	public interface IUserClient
	{
		Task UsernameChanged(UserInfoDto user);
		Task AvatarChanged(UserInfoDto user);
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
