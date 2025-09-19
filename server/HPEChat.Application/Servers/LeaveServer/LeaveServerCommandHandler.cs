using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.LeaveServer
{
	internal class LeaveServerCommandHandler : IRequestHandler<LeaveServerCommand>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly ILogger<LeaveServerCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IServerNotificationService _serverNotificationService;
		public LeaveServerCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IServerNotificationService serverNotificationService,
			ILogger<LeaveServerCommandHandler> logger,
			IUnitOfWork unitOfWork)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
			_unitOfWork = unitOfWork;
		}
		public async Task Handle(LeaveServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsync(request.ServerId, cancellationToken);
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found.", request.ServerId);
				throw new ApplicationException("Server not found.");
			}

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			if (user.Id == server.OwnerId)
			{
				_logger.LogWarning("User with ID {UserId} is the owner of the server with ID {ServerId} and cannot leave.", request.UserId, request.ServerId);
				throw new ApplicationException("Server owner cannot leave the server. Consider deleting the server instead.");
			}

			if (!server.Members.Any(m => m.Id == user.Id))
			{
				_logger.LogWarning("User with ID {UserId} is not a member of the server with ID {ServerId}.", request.UserId, request.ServerId);
				throw new ApplicationException("User is not a member of the server.");
			}

			await _unitOfWork.BeginTransactionAsync();

			try
			{
				server.Members.Remove(user);
				_serverRepository.Update(server);
				await _unitOfWork.CommitTransactionAsync();

				await _serverNotificationService.NotifyUserLeft(request.ServerId, request.UserId);

				await _serverNotificationService.RemoveUserFromGroup(request.UserId, request.ServerId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "An error occurred while user with ID {UserId} was trying to leave the server with ID {ServerId}.", request.UserId, request.ServerId);
				await _unitOfWork.RollbackTransactionAsync();
				throw new ApplicationException("An error occurred while trying to leave the server.");
			}

		}
	}
}
