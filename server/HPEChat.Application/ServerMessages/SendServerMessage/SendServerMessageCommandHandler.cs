using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Enums;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Application.Interfaces;
using HPEChat.Application.Extensions;

namespace HPEChat.Application.ServerMessages.SendServerMessage
{
	internal class SendServerMessageCommandHandler : IRequestHandler<SendServerMessageCommand, ServerMessageDto>
	{
		private readonly IChannelRepository _channelRepository;
		private readonly IServerMessageRepository _serverMessageRepository;
		private readonly IAttachmentRepository _attachmentRepository;
		private readonly IFileService _fileService;
		private readonly ILogger<SendServerMessageCommandHandler> _logger;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IServerNotificationService _serverNotificationService;
		public SendServerMessageCommandHandler(
			IChannelRepository channelRepository,
			IServerMessageRepository serverMessageRepository,
			IAttachmentRepository attachmentRepository,
			IFileService fileService,
			ILogger<SendServerMessageCommandHandler> logger,
			IUnitOfWork unitOfWork,
			IServerNotificationService serverNotificationService)
		{
			_channelRepository = channelRepository;
			_serverMessageRepository = serverMessageRepository;
			_attachmentRepository = attachmentRepository;
			_fileService = fileService;
			_logger = logger;
			_unitOfWork = unitOfWork;
			_serverNotificationService = serverNotificationService;
		}
		public async Task<ServerMessageDto> Handle(SendServerMessageCommand request, CancellationToken cancellationToken)
		{
			var channel = await _channelRepository.GetByIdAsync(request.ChannelId, cancellationToken);

			if (channel == null) {
				_logger.LogWarning("Channel with ID {ChannelId} not found.", request.ChannelId);
				throw new KeyNotFoundException("Channel not found.");
			}

			if (channel.Server.Members.Any(m => m.Id == request.UserId) == false)
			{
				_logger.LogWarning("User with ID {UserId} cannot access channel with ID {ChannelId}.", request.UserId, request.ChannelId);
				throw new UnauthorizedAccessException("User cannot access this channel.");
			}

			string? uploadedFilePath = null;
			string? uploadedPreviewPath = null;

			await _unitOfWork.BeginTransactionAsync();
			try
			{
				var message = new ServerMessage
				{
					ChannelId = request.ChannelId,
					SenderId = request.UserId,
					Message = request.Message,
					SentAt = DateTimeOffset.UtcNow,
					IsEdited = false,
				};

				Attachment? attachment = null;
				if (request.Attachment != null)
				{
					var attachmentType = FileExtension.CheckFile(request.Attachment);

					if (attachmentType == null)
					{
						throw new Exception("Unsupported attachment type.");
					}

					long size = request.Attachment.Length;

					uploadedFilePath = await _fileService.UploadFile(request.Attachment, cancellationToken);
					if (uploadedFilePath == null) throw new Exception("Failed to upload attachment.");

					int? width = null, height = null;
					string? previewPath = null;

					if (attachmentType == AttachmentType.Image)
					{
						(width, height) = FileExtension.GetImageDimensions(request.Attachment);

						// preview images are smaller and they will load when user scrolls messages
						// if user clicks on an image original will load
						uploadedPreviewPath = await _fileService.GenerateAndUploadPreviewImage(request.Attachment, cancellationToken);
						uploadedPreviewPath ??= uploadedFilePath;
						previewPath = uploadedPreviewPath;
					}
					else if (attachmentType == AttachmentType.Video)
					{
						// no ffmpeg support in this version
						//(width, height) = await FileExtension.GetVideoDimensions(filePath);
					}

					attachment = new Attachment
					{
						Name = request.Attachment.FileName,
						StoredFileName = uploadedFilePath,
						ContentType = attachmentType.Value,
						Size = size,
						Width = width,
						Height = height,
						PreviewName = previewPath,
						UploadedAt = DateTimeOffset.UtcNow
					};

					await _attachmentRepository.AddAsync(attachment, cancellationToken);
					await _unitOfWork.SaveChangesAsync();
				}

				message.Attachment = attachment;

				await _serverMessageRepository.AddAsync(message, cancellationToken);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				var messageDto = new ServerMessageDto
				{
					Id = message.Id,
					ChannelId = message.ChannelId,
					Message = message.Message ?? string.Empty,
					SentAt = message.SentAt,
					IsEdited = message.IsEdited,
					Sender = message.Sender != null ? new UserInfoDto
					{
						Id = message.Sender.Id,
						Username = message.Sender.Username,
						Image = message.Sender.Image ?? string.Empty,
					} : new UserInfoDto
					{
						Id = Guid.Empty,
						Username = string.Empty,
						Image = string.Empty,
					},
					Attachment = message.Attachment != null ? new AttachmentDto
					{
						Id = message.Attachment.Id,
						Name = message.Attachment.Name,
						Type = message.Attachment.ContentType,
						Size = message.Attachment.Size,
						Width = message.Attachment.Width,
						Height = message.Attachment.Height,
						FileName = message.Attachment.StoredFileName,
						PreviewName = message.Attachment.PreviewName ?? string.Empty
					} : null
				};

				await _serverNotificationService.NotifyMessageAdded(channel.ServerId, messageDto);

				return messageDto;
			}
			catch (Exception ex)
			{
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);

				// clean up any uploaded files if transaction failed
				if (uploadedFilePath != null)
				{
					_fileService.DeleteFile(uploadedFilePath);
				}
				if (uploadedPreviewPath != null && uploadedPreviewPath != uploadedFilePath)
				{
					_fileService.DeleteFile(uploadedPreviewPath);
				}

				_logger.LogError(ex, "Error sending message in channel {ChannelId} by user {UserId}", request.ChannelId, request.UserId);
				throw;
			}
		}
	}
}
