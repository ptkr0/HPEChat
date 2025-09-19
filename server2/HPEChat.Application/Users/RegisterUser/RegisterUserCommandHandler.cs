using HPEChat.Application.Services;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Extensions;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.RegisterUser
{
	internal class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, UserInfoDto>
	{
		private readonly IUserRepository _userRepository;
		private readonly FileService _fileService;
		private readonly ILogger<RegisterUserCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IHubContext<UserHub, IUserClient> _userHub;
		private readonly IPasswordHasher<User> _passwordHasher;
		public RegisterUserCommandHandler(
			IUserRepository userRepository,
			FileService fileService,
			ILogger<RegisterUserCommandHandler> logger,
			IUnitOfWork unitOfWork,
			IHubContext<UserHub, IUserClient> userHub,
			IPasswordHasher<User> passwordHasher)
		{
			_userRepository = userRepository;
			_fileService = fileService;
			_logger = logger;
			_unitOfWork = unitOfWork;
			_userHub = userHub;
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

			await _unitOfWork.BeginTransactionAsync();

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
					imagePath = await _fileService.UploadAvatar(request.Image, user.Id);

					if (string.IsNullOrEmpty(imagePath))
					{
						_logger.LogWarning("Failed to upload avatar for user with ID {UserId}. Rolling back user creation.", user.Id);
						throw new ApplicationException("Failed to upload avatar.");
					}

					user.Image = imagePath;
					_userRepository.Update(user);
				}

				await _unitOfWork.CommitTransactionAsync();

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
