using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.JoinServer
{
	internal class JoinServerCommandHandler : IRequestHandler<JoinServerCommand, ServerDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly ILogger<JoinServerCommandHandler> _logger;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		private readonly IUnitOfWork _unitOfWork;
		public JoinServerCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IHubContext<ServerHub, IServerClient> serverHub,
			ILogger<JoinServerCommandHandler> logger,
			IUnitOfWork unitOfWork)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_serverHub = serverHub;
			_logger = logger;
			_unitOfWork = unitOfWork;
		}
		public async Task<ServerDto> Handle(JoinServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsync(request.ServerId, cancellationToken);
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found.", request.ServerId);
				throw new ApplicationException("Server not found.");
			}

			if (server.OwnerId == user.Id || server.Members.Any(m => m.Id == user.Id))
			{
				_logger.LogWarning("User with ID {UserId} is already a member of the server with ID {ServerId}.", request.UserId, request.ServerId);
				throw new ApplicationException("User is already a member of the server.");
			}

			await _unitOfWork.BeginTransactionAsync();

			try
			{
				server.Members.Add(user);
				_serverRepository.Update(server);

				await _unitOfWork.CommitTransactionAsync();

				var serverDto = new ServerDto
				{
					Id = server.Id,
					Name = server.Name,
					Description = server.Description,
					OwnerId = server.OwnerId,
					Image = server.Image,
					Members = server.Members.Select(m => new Application.Users.Dtos.UserInfoDto
					{
						Id = m.Id,
						Username = m.Username,
						Role = m.Role,
						Image = m.Image
					})
					.OrderBy(m => m.Username)
					.ToList(),
					Channels = server.Channels.Select(c => new Application.Channels.Dtos.ChannelDto
					{
						Id = c.Id,
						Name = c.Name,
					})
					.OrderBy(c => c.Name)
					.ToList()
				};

				await _serverHub
						.Clients
						.Group(ServerHub.GroupName(server.Id))
						.UserJoined(server.Id, new UserInfoDto
						{
							Id = user.Id,
							Username = user.Username,
							Role = user.Role,
							Image = user.Image ?? string.Empty,
						});

				return serverDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while user with ID {UserId} was trying to join server with ID {ServerId}.", request.UserId, request.ServerId);
				await _unitOfWork.RollbackTransactionAsync();
				throw;
			}
		}
	}
}
