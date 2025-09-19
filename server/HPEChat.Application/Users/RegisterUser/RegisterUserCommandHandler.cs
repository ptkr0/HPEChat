using HPEChat.Application.Extensions;
using HPEChat.Application.Interfaces;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.RegisterUser
{
	internal class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, UserInfoDto>
	{
		private readonly IUserRepository _userRepository;
		private readonly IFileService _fileService;
		private readonly ILogger<RegisterUserCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IUserNotificationService _userNotificationService;
		private readonly IPasswordHasher<User> _passwordHasher;
		public RegisterUserCommandHandler(
			IUserRepository userRepository,
			IFileService fileService,
			ILogger<RegisterUserCommandHandler> logger,
			IUnitOfWork unitOfWork,
			IUserNotificationService userNotificationService,
			IPasswordHasher<User> passwordHasher)
		{
			_userRepository = userRepository;
			_fileService = fileService;
			_logger = logger;
			_unitOfWork = unitOfWork;
			_userNotificationService = userNotificationService;
			_passwordHasher = passwordHasher;
		}
		public async Task<UserInfoDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
		{
			if (await _userRepository.ExistsByUsernameAsync(request.Username, cancellationToken))
			{
				_logger.LogWarning("User with name {Username} already exists.", request.Username);
				throw new ApplicationException("User with the same name already exists.");
			}

			if (request.Image != null && !FileExtension.IsValidAvatar(request.Image))
			{
				throw new ApplicationException("Invalid image file type or size.");
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);

			string? imagePath = null;

			try
			{
				var user = new User
				{
					Username = request.Username,
					Role = "User",
				};

				user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

				await _userRepository.AddAsync(user, cancellationToken);

				if (request.Image != null)
				{
					await _unitOfWork.SaveChangesAsync(cancellationToken);
					imagePath = await _fileService.UploadAvatar(request.Image, user.Id, cancellationToken);

					if (string.IsNullOrEmpty(imagePath))
					{
						_logger.LogWarning("Failed to upload avatar for user with ID {UserId}. Rolling back user creation.", user.Id);
						throw new ApplicationException("Failed to upload avatar.");
					}

					user.Image = imagePath;
					_userRepository.Update(user);
				}

				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				var userDto = new UserInfoDto
				{
					Id = user.Id,
					Username = user.Username,
					Role = user.Role,
					Image = user.Image,
				};

				return userDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while registering user {Username}. Rolling back transaction.", request.Username);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);

				if (imagePath != null)
				{
					_fileService.DeleteFile(imagePath);
				}

				throw new ApplicationException("User registration failed. Please try again.");
			}
		}
	}
}
