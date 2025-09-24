using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Common.Exceptions.Server;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.JoinServer
{
	internal class JoinServerCommandHandler : IRequestHandler<JoinServerCommand, ServerDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly ILogger<JoinServerCommandHandler> _logger;
		private readonly IServerNotificationService _serverNotificationService;
		private readonly IUnitOfWork _unitOfWork;
		public JoinServerCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IServerNotificationService serverNotificationService,
			ILogger<JoinServerCommandHandler> logger,
			IUnitOfWork unitOfWork)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
			_unitOfWork = unitOfWork;
		}
		public async Task<ServerDto> Handle(JoinServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsByNameAsync(request.Name, cancellationToken)
				?? throw new KeyNotFoundException("Server not found.");


			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken) 
				?? throw new KeyNotFoundException("User not found.");

			if (server.OwnerId == user.Id || server.Members.Any(m => m.Id == user.Id))
			{
				throw new AlreadyMemberException();
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);

			try
			{
				server.Members.Add(user);
				_serverRepository.Update(server);

				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				var serverDto = new ServerDto
				{
					Id = server.Id,
					Name = server.Name,
					Description = server.Description,
					OwnerId = server.OwnerId,
					Image = server.Image,
					Members = server.Members.Select(m => new UserInfoDto
					{
						Id = m.Id,
						Username = m.Username,
						Role = m.Role,
						Image = m.Image
					})
					.OrderBy(m => m.Username)
					.ToList(),
					Channels = server.Channels.Select(c => new ChannelDto
					{
						Id = c.Id,
						Name = c.Name,
					})
					.OrderBy(c => c.Name)
					.ToList()
				};

				await _serverNotificationService.NotifyUserJoined(server.Id, new UserInfoDto
				{
					Id = user.Id,
					Username = user.Username,
					Role = user.Role,
					Image = user.Image
				});

				return serverDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while user with ID {UserId} was trying to join server with Name {Name}.", request.UserId, request.Name);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;
			}
		}
	}
}
