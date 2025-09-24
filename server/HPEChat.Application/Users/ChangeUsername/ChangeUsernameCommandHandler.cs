using HPEChat.Application.Exceptions.User;
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
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("User not found.");

			var exists = await _userRepository.ExistsByUsernameAsync(request.NewUsername, cancellationToken);

			if (exists)
			{
				throw new DuplicateUsernameException(request.NewUsername);
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
