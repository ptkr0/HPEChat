using HPEChat.Application.Common.Exceptions.User;
using HPEChat.Application.Common.Extensions;
using HPEChat.Application.Common.Interfaces;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.ChangeImage
{
	internal class ChangeImageCommandHandler : IRequestHandler<ChangeImageCommand, UserInfoDto>
	{
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IFileService _fileService;
		private readonly IUserNotificationService _userNotificationService;
		private readonly ILogger<ChangeImageCommandHandler> _logger;

		public ChangeImageCommandHandler(
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IFileService fileService,
			IUserNotificationService userNotificationService,
			ILogger<ChangeImageCommandHandler> logger)
		{
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_userNotificationService = userNotificationService;
			_logger = logger;
		}

		public async Task<UserInfoDto> Handle(ChangeImageCommand request, CancellationToken cancellationToken)
		{
			if (request.Image != null && !FileExtension.IsValidAvatar(request.Image))
			{
				throw new InvalidUserImageException();
			}

			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("User not found.");

			var updatedUserDto = request.Image == null
				? await HandleImageDeletionAsync(user)
				: await HandleImageUpdateAsync(user, request.Image, cancellationToken);

			await _userNotificationService.NotifyImageChanged(updatedUserDto);

			return updatedUserDto;
		}

		private async Task<UserInfoDto> HandleImageDeletionAsync(User user)
		{
			if (string.IsNullOrEmpty(user.Image))
			{
				// user has no avatar, nothing to do
				return MapToDto(user);
			}

			if (!_fileService.DeleteFile(user.Image))
			{
				_logger.LogError("An error occurred while deleting the old avatar '{ImagePath}' for user {UserId}", user.Image, user.Id);
				throw new ApplicationException("Failed to delete old image.");
			}

			user.Image = string.Empty;
			_userRepository.Update(user);
			await _unitOfWork.CommitTransactionAsync();

			_logger.LogInformation("Deleted avatar for {UserId}.", user.Id);
			return MapToDto(user);
		}

		private async Task<UserInfoDto> HandleImageUpdateAsync(User user, IFormFile newAvatar, CancellationToken cancellationToken)
		{
			// 1. upload new image
			var newImagePath = await _fileService.UploadAvatar(newAvatar, user.Id, cancellationToken);
			if (string.IsNullOrEmpty(newImagePath))
			{
				throw new ApplicationException("Failed to save new image.");
			}

			// 2. if old image exists, delete it
			var oldImagePath = user.Image;
			if (!string.IsNullOrEmpty(oldImagePath))
			{
				if (!_fileService.DeleteFile(oldImagePath))
				{
					// if deleting the old image fails, delete the newly uploaded image to avoid orphaned files
					_fileService.DeleteFile(newImagePath);
					_logger.LogError("An error occurred while deleting the old avatar '{ImagePath}' for user {UserId}. Reverting avatar change.", oldImagePath, user.Id);
					throw new ApplicationException("Failed to delete old image.");
				}
			}

			// 3. update user record
			user.Image = newImagePath;
			_userRepository.Update(user);
			await _unitOfWork.CommitTransactionAsync(cancellationToken);

			_logger.LogInformation("Uploaded new avatar for user {UserId} at '{ImagePath}'.", user.Id, newImagePath);
			return MapToDto(user);
		}

		private UserInfoDto MapToDto(User user) => new UserInfoDto
		{
			Id = user.Id,
			Username = user.Username,
			Role = user.Role,
			Image = user.Image,
		};
	}
}