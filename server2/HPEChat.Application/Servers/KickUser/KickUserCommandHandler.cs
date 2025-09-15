using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using HPEChat_Server.Services;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.KickUser
{
	internal class KickUserCommandHandler : IRequestHandler<KickUserCommand>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly ILogger<KickUserCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		private readonly ConnectionMapperService _connectionMapperService;
		public KickUserCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IHubContext<ServerHub, IServerClient> serverHub,
			ILogger<KickUserCommandHandler> logger,
			ConnectionMapperService connectionMapperService)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_serverHub = serverHub;
			_logger = logger;
			_connectionMapperService = connectionMapperService;
		}
		public async Task Handle(KickUserCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsync(request.ServerId, cancellationToken);
			var kickee = await _userRepository.GetByIdAsync(request.KickeeId, cancellationToken);

			if (kickee == null)
			{
				_logger.LogWarning("User with ID {KickeeId} not found.", request.KickeeId);
				throw new ApplicationException("User not found.");
			}

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found.", request.ServerId);
				throw new ApplicationException("Server not found.");
			}

			if (server.OwnerId != request.KickerId)
			{
				_logger.LogWarning("User with ID {RequesterId} is not the owner of the server with ID {ServerId}. Kick action denied.", request.KickerId, request.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can kick members.");
			}

			if (kickee.Id == server.OwnerId || !server.Members.Any(m => m.Id == kickee.Id))
			{
				_logger.LogWarning("User with ID {KickeeId} is not a member of the server with ID {ServerId} or is the owner.", request.KickeeId, request.ServerId);
				throw new ApplicationException("User is not a member of the server or is the owner.");
			}

			await _unitOfWork.BeginTransactionAsync();

			try
			{
				server.Members.Remove(kickee);
				_serverRepository.Update(server);
				await _unitOfWork.CommitTransactionAsync();

				await _serverHub
					.Clients
					.Group(ServerHub.GroupName(server.Id))
					.UserLeft(server.Id, kickee.Id);


				var connectionIds = _connectionMapperService.GetConnections(kickee.Id);
				foreach (var connId in connectionIds)
					await _serverHub
							.Groups
							.RemoveFromGroupAsync(connId, ServerHub.GroupName(server.Id), cancellationToken);
			}
			catch (Exception ex)
			{
				await _unitOfWork.RollbackTransactionAsync();
				_logger.LogError(ex, "An error occurred while trying to kick user with ID {KickeeId} from server with ID {ServerId}.", request.KickeeId, request.ServerId);
				throw;
			}
		}
	}
}
