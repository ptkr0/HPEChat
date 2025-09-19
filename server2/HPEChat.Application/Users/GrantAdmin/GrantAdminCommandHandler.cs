using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.GrantAdmin
{
	internal class GrantAdminCommandHandler : IRequestHandler<GrantAdminCommand>
	{
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IHubContext<UserHub, IUserClient> _userHub;
		private readonly ILogger<GrantAdminCommandHandler> _logger;
		public GrantAdminCommandHandler(
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IHubContext<UserHub, IUserClient> userHub,
			ILogger<GrantAdminCommandHandler> logger)
		{
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_userHub = userHub;
			_logger = logger;
		}
		public async Task Handle(GrantAdminCommand request, CancellationToken cancellationToken)
		{
			var owner = await _userRepository.GetByIdAsync(request.OwnerId, cancellationToken);

			if (owner == null)
			{
				_logger.LogWarning("Owner with ID {OwnerId} not found when trying to grant admin rights.", request.OwnerId);
				throw new ApplicationException("Owner not found.");
			}

			if (owner.Role != "Owner")
			{
				_logger.LogWarning("User with ID {OwnerId} is not an owner and cannot grant admin rights.", request.OwnerId);
				throw new UnauthorizedAccessException("Only owners can grant admin rights.");
			}

			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found when trying to grant admin rights.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			if (user.Role == "Admin")
			{
				_logger.LogWarning("User with ID {UserId} is already an admin.", request.UserId);
				throw new ApplicationException("User is already an admin.");
			}

			user.Role = "Admin";
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);
		}
	}
}
