using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Services;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Extensions;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.CreateServer
{
	public class CreateServerCommandHandler : IRequestHandler<CreateServerCommand, ServerDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IUserRepository _userRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly FileService _fileService;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		private readonly ILogger<CreateServerCommandHandler> _logger;
		public CreateServerCommandHandler(
			IServerRepository serverRepository,
			IUserRepository userRepository,
			IUnitOfWork unitOfWork,
			FileService fileService,
			IHubContext<ServerHub, IServerClient> serverHub,
			ILogger<CreateServerCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_userRepository = userRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_serverHub = serverHub;
			_logger = logger;
		}
		public async Task<ServerDto> Handle(CreateServerCommand request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				_logger.LogWarning("User with ID {UserId} not found when trying to create a server.", request.UserId);
				throw new ApplicationException("User not found.");
			}

			if (await _serverRepository.ExistsByNameAsync(request.Name, cancellationToken))
			{
				_logger.LogWarning("Server with name {ServerName} already exists.", request.Name);
				throw new ApplicationException("Server with the same name already exists.");
			}

			await _unitOfWork.BeginTransactionAsync();

			string? imagePath = null;

			try
			{
				var server = new Server
				{
					Name = request.Name,
					Description = request.Description ?? string.Empty,
					OwnerId = request.UserId,
					Image = string.Empty,
				};

				server.Members.Add(user);

				await _serverRepository.AddAsync(server);

				if (request.Image != null)
				{
					if (!FileExtension.IsValidAvatar(request.Image))
					{
						throw new ApplicationException("Invalid image file type or size.");
					}

					imagePath = await _fileService.UploadServerPicture(request.Image, server.Id);

					if (imagePath == null)
					{
						throw new ApplicationException("Failed to upload image.");
					}

					server.Image = imagePath;
					_serverRepository.Update(server);
				}

				await _unitOfWork.CommitTransactionAsync();

				var userDto = new UserInfoDto
				{
					Id = user.Id,
					Username = user.Username,
					Role = user.Role,
					Image = user.Image,
				};

				await _serverHub
					.Clients
					.Group(ServerHub.GroupName(server.Id))
					.UserJoined(server.Id, userDto);

				return new ServerDto
				{
					Id = server.Id,
					Name = server.Name,
					Description = server.Description,
					Image = server.Image,
					OwnerId = server.OwnerId,
					Members = new List<UserInfoDto> { userDto },
					Channels = new List<ChannelDto>()
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while creating server.");
				_unitOfWork.RollbackTransaction();

				if (imagePath != null)
				{
					_fileService.DeleteFile(imagePath);
				}

				throw new ApplicationException("An error occurred while creating the server. Please try again.");
			}

		}
	}
}
