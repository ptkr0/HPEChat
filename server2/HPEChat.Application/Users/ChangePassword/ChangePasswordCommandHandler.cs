using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.ChangePassword
{
	internal class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
	{
		private readonly IUserRepository _userRepository;
		private readonly IPasswordHasher<User> _passwordHasher;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<ChangePasswordCommandHandler> _logger;
		public ChangePasswordCommandHandler(
			IUserRepository userRepository,
			IPasswordHasher<User> passwordHasher,
			IUnitOfWork unitOfWork,
			ILogger<ChangePasswordCommandHandler> logger)
		{
			_userRepository = userRepository;
			_passwordHasher = passwordHasher;
			_unitOfWork = unitOfWork;
			_logger = logger;
		}
		public async Task Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found when trying to change password.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);

			if (verificationResult == PasswordVerificationResult.Failed)
			{
				_logger.LogWarning("Invalid current password for user ID {UserId}.", request.UserId);
				throw new ApplicationException("Current password is incorrect.");
			}

			user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("Password changed successfully for user ID {UserId}.", request.UserId);
		}
	}
}
