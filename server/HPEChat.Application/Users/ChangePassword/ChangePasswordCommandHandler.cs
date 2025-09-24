using HPEChat.Application.Common.Exceptions.User;
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
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("User not found.");

			var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);

			if (verificationResult == PasswordVerificationResult.Failed)
			{
				throw new InvalidPasswordException();
			}

			user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("Password changed successfully for user ID {UserId}.", request.UserId);
		}
	}
}
