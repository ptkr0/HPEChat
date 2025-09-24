using HPEChat.Application.Common.Exceptions.Server;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
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
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsync(request.ServerId, cancellationToken)
				?? throw new KeyNotFoundException("Server not found.");

			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("User not found.");

			if (user.Id == server.OwnerId)
			{
				throw new UserIsOwnerException();
			}

			if (!server.Members.Any(m => m.Id == user.Id))
			{
				throw new NotAMemberException();
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);

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
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw new ApplicationException("An error occurred while trying to leave the server.");
			}

		}
	}
}
