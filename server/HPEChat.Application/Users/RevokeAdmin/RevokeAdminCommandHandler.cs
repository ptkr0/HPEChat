using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using HPEChat.Application.Interfaces.Notifications;

namespace HPEChat.Application.Users.RevokeAdmin
{
	internal class RevokeAdminCommandHandler
	{
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IUserNotificationService _userNotificationService;
		private readonly ILogger<RevokeAdminCommandHandler> _logger;
		public RevokeAdminCommandHandler(
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IUserNotificationService userNotificationService,
			ILogger<RevokeAdminCommandHandler> logger)
		{
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_userNotificationService = userNotificationService;
			_logger = logger;
		}
		public async Task Handle(RevokeAdminCommand request, CancellationToken cancellationToken)
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

			if (user.Role != "Admin")
			{
				_logger.LogWarning("User with ID {UserId} is not an admin.", request.UserId);
				throw new ApplicationException("User is not an admin.");
			}

			user.Role = "User";
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);
		}
	}
}
