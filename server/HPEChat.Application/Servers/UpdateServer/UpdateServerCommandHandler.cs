using HPEChat.Application.Servers.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.Interfaces;
using HPEChat.Application.Extensions;

namespace HPEChat.Application.Servers.UpdateServer
{
	internal class UpdateServerCommandHandler : IRequestHandler<UpdateServerCommand, ServerDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IFileService _fileService;
		private readonly ILogger<UpdateServerCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IServerNotificationService _serverNotificationService;
		public UpdateServerCommandHandler(
			IServerRepository serverRepository,
			IFileService fileService,
			IUnitOfWork unitOfWork,
			IServerNotificationService serverNotificationService,
			ILogger<UpdateServerCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_fileService = fileService;
			_unitOfWork = unitOfWork;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		public async Task<ServerDto> Handle(UpdateServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetByIdAsync(request.ServerId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found for update.", request.ServerId);
				throw new KeyNotFoundException("Server not found.");
			}

			if (server.OwnerId != request.OwnerId)
			{
				_logger.LogWarning("User with ID {OwnerId} is not the owner of server with ID {ServerId}. Update denied.", request.OwnerId, request.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can update the server.");
			}

			// track old image for best‑effort cleanup after DB commit
			string? oldImagePath = server.Image;

			await _unitOfWork.BeginTransactionAsync();
			try
			{
				// check if user wants to delete image (deleteImage = true and no new image provided)
				if (request.DeleteImage && !string.IsNullOrWhiteSpace(server.Image))
				{
					oldImagePath = server.Image;
					server.Image = "";
				}

				// check if user provided a new image (wants to change or add new)
				else if (!request.DeleteImage && request.Image != null && FileExtension.IsValidAvatar(request.Image))
				{
					var uploadedImage = await _fileService.UploadServerPicture(request.Image, server.Id, cancellationToken);

					if (uploadedImage == null)
					{
						_logger.LogError("Failed to upload new image for server with ID {ServerId}.", request.ServerId);
						throw new ApplicationException("Failed to upload image.");
					}

					oldImagePath = server.Image;
					server.Image = uploadedImage;
				}

				// update name if provided and not empty or already used
				if (!string.IsNullOrWhiteSpace(request.Name))
				{
					if (await _serverRepository.ExistsByNameAsync(request.Name, cancellationToken) && !string.Equals(server.Name, request.Name, StringComparison.OrdinalIgnoreCase))
					{
						_logger.LogWarning("Server with name {ServerName} already exists.", request.Name);
						throw new ApplicationException("Server with the same name already exists.");
					}
					server.Name = request.Name;
				}

				server.Description = request.Description ?? string.Empty;

				_serverRepository.Update(server);
				await _unitOfWork.CommitTransactionAsync();

				// best‑effort cleanup of old image if it was changed or deleted
				if (!string.IsNullOrWhiteSpace(oldImagePath) && oldImagePath != server.Image)
				{
					try
					{
						_fileService.DeleteFile(oldImagePath);
					}
					catch (Exception ex)
					{
						_logger.LogError(ex, "Failed to delete old image {ImagePath} after updating server ID {ServerId}.", oldImagePath, request.ServerId);
					}
				}

				await _serverNotificationService.NotifyServerUpdated(server.Id, new ServerDto
					{
						Id = server.Id,
						Name = server.Name,
						Description = server.Description,
						OwnerId = server.OwnerId,
						Image = server.Image ?? string.Empty,
					});

				_logger.LogInformation("Server {ServerName} updated by user {UserId}", server.Name, request.OwnerId);

				return new ServerDto
				{
					Id = server.Id,
					Name = server.Name,
					Description = server.Description,
					OwnerId = server.OwnerId,
					Image = server.Image ?? string.Empty,
				};
			}
			catch (Exception)
			{
				await _unitOfWork.RollbackTransactionAsync();
				_logger.LogError("An error occurred while updating server with ID {ServerId}. Transaction rolled back.", request.ServerId);

				// best‑effort cleanup of newly uploaded image if an error occurred
				if (server.Image != oldImagePath && !string.IsNullOrWhiteSpace(server.Image))
				{
					try
					{
						_fileService.DeleteFile(server.Image);
					}
					catch (Exception ex)
					{
						_logger.LogError(ex, "Failed to delete newly uploaded image {ImagePath} after an error occurred during server update for server ID {ServerId}.", server.Image, request.ServerId);
					}
				}
				throw;
			}
		}
	}
}
