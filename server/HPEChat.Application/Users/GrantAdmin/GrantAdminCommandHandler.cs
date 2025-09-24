using HPEChat.Application.Exceptions.User;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.GrantAdmin
{
	internal class GrantAdminCommandHandler : IRequestHandler<GrantAdminCommand>
	{
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IUserNotificationService _userNotificationService;
		private readonly ILogger<GrantAdminCommandHandler> _logger;
		public GrantAdminCommandHandler(
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IUserNotificationService userNotificationService,
			ILogger<GrantAdminCommandHandler> logger)
		{
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_userNotificationService = userNotificationService;
			_logger = logger;
		}
		public async Task Handle(GrantAdminCommand request, CancellationToken cancellationToken)
		{
			var owner = await _userRepository.GetByIdAsync(request.OwnerId, cancellationToken)
				?? throw new KeyNotFoundException("Owner not found.");

			if (owner.Role != "Owner")
			{
				throw new UnauthorizedAccessException("Only owners can grant admin rights.");
			}

			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("User not found.");

			if (user.Role == "Admin")
			{
				_logger.LogWarning("User with ID {UserId} is already an admin.", request.UserId);
				throw new AlreadyAnAdminException(user.Username);
			}

			user.Role = "Admin";
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);
		}
	}
}
