using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Users.ChangeUsername
{
	internal class ChangeUsernameCommandHandler : IRequestHandler<ChangeUsernameCommand, UserInfoDto>
	{
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IUserNotificationService _userNotificationService;
		private readonly ILogger<ChangeUsernameCommandHandler> _logger;
		public ChangeUsernameCommandHandler(
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			IUserNotificationService userNotificationService,
			ILogger<ChangeUsernameCommandHandler> logger)
		{
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_userNotificationService = userNotificationService;
			_logger = logger;
		}
		public async Task<UserInfoDto> Handle(ChangeUsernameCommand request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found when trying to change username.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			var exists = await _userRepository.ExistsByUsernameAsync(request.NewUsername, cancellationToken);

			if (exists)
			{
				_logger.LogWarning("Username {NewUsername} is already taken.", request.NewUsername);
				throw new ApplicationException("Username is already taken.");
			}

			user.Username = request.NewUsername;
			_userRepository.Update(user);
			await _unitOfWork.SaveChangesAsync(cancellationToken);

			var userInfoDto = new UserInfoDto
			{
				Id = user.Id,
				Username = user.Username,
				Image = user.Image,
				Role = user.Role
			};

			await _userNotificationService.NotifyUsernameChanged(userInfoDto);

			return userInfoDto;
		}
	}
}
