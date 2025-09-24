using HPEChat.Application.Common.Exceptions.Server;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.KickUser
{
	internal class KickUserCommandHandler : IRequestHandler<KickUserCommand>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly ILogger<KickUserCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IServerNotificationService _serverNotificationService;
		public KickUserCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IServerNotificationService serverNotificationService,
			ILogger<KickUserCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		public async Task Handle(KickUserCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsync(request.ServerId, cancellationToken)
				?? throw new KeyNotFoundException("Server not found.");

			var kickee = await _userRepository.GetByIdAsync(request.KickeeId, cancellationToken)
				?? throw new KeyNotFoundException("User to be kicked not found.");

			if (server.OwnerId != request.KickerId)
			{
				_logger.LogWarning("User with ID {RequesterId} is not the owner of the server with ID {ServerId}. Kick action denied.", request.KickerId, request.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can kick members.");
			}

			if (kickee.Id == server.OwnerId)
			{
				throw new UserIsOwnerException();
			}

			if (!server.Members.Any(m => m.Id == kickee.Id))
			{
				_logger.LogWarning("User with ID {KickeeId} is not a member of the server with ID {ServerId}.", request.KickeeId, request.ServerId);
				throw new NotAMemberException();
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);

			try
			{
				server.Members.Remove(kickee);
				_serverRepository.Update(server);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				await _serverNotificationService.NotifyChannelRemoved(request.ServerId, request.KickeeId);

				await _serverNotificationService.RemoveUserFromGroup(request.KickeeId, request.ServerId);
			}
			catch (Exception ex)
			{
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				_logger.LogError(ex, "An error occurred while trying to kick user with ID {KickeeId} from server with ID {ServerId}.", request.KickeeId, request.ServerId);

				throw;
			}
		}
	}
}
