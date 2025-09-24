using HPEChat.Application.Common.Interfaces;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.LoginUser
{
	internal class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, ReturnLoginDto>
	{
		private readonly IUserRepository _userRepository;
		private readonly ILogger<LoginUserCommandHandler> _logger;
		private readonly IPasswordHasher<User> _passwordHasher;
		private readonly ITokenGenerator _tokenGenerator;
		public LoginUserCommandHandler(
			IUserRepository userRepository,
			ILogger<LoginUserCommandHandler> logger,
			IPasswordHasher<User> passwordHasher,
			ITokenGenerator tokenGenerator)
		{
			_userRepository = userRepository;
			_logger = logger;
			_passwordHasher = passwordHasher;
			_tokenGenerator = tokenGenerator;
		}
		public async Task<ReturnLoginDto> Handle(LoginUserCommand request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByNameAsync(request.Username, cancellationToken)
				?? throw new ApplicationException("Invalid username or password.");

			var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

			if (verificationResult == PasswordVerificationResult.Failed)
			{
				_logger.LogWarning("Invalid password for user {Username}.", request.Username);
				throw new ApplicationException("Invalid username or password.");
			}

			var token = _tokenGenerator.GenerateToken(user);

			var userInfoDto = new ReturnLoginDto
			{
				Id = user.Id,
				Username = user.Username,
				Image = user.Image,
				Role = user.Role,
				Token = token
			};

			return userInfoDto;
		}
	}
}
