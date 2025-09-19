using HPEChat.Application.Interfaces;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Channels.DeleteChannel
{
	internal class DeleteChannelCommandHandler : IRequestHandler<DeleteChannelCommand>
	{
		private readonly IChannelRepository _channelRepository;
		private readonly IAttachmentRepository _attachmentRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IFileService _fileService;
		private readonly ILogger<DeleteChannelCommandHandler> _logger;
		private readonly IServerNotificationService _serverNotificationService;
		public DeleteChannelCommandHandler(
			IChannelRepository channelRepository,
			IAttachmentRepository attachmentRepository,
			IUnitOfWork unitOfWork,
			IFileService fileService,
			ILogger<DeleteChannelCommandHandler> logger,
			IServerNotificationService serverNotificationService)
		{
			_channelRepository = channelRepository;
			_attachmentRepository = attachmentRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_logger = logger;
			_serverNotificationService = serverNotificationService;
		}
		public async Task Handle(DeleteChannelCommand request, CancellationToken cancellationToken)
		{
			var channel = await _channelRepository.GetByIdAsync(request.ChannelId, cancellationToken);

			if (channel == null)
			{
				_logger.LogWarning("Channel with ID {ChannelId} not found for deletion.", request.ChannelId);
				throw new KeyNotFoundException("Channel not found.");
			}

			if (channel.Server.OwnerId != request.UserId)
			{
				_logger.LogWarning("User with ID {UserId} is not the owner of the server with ID {ServerId}. Channel deletion denied.", request.UserId, channel.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can delete channels.");
			}

			var filesToDelete = new List<string>();

			var attachments = await _attachmentRepository.GetAttachmentsFromChannelByIdAsync(channel.Id, cancellationToken);

			foreach (var attachment in attachments)
			{
				filesToDelete.Add(attachment.StoredFileName);
				if (!string.IsNullOrEmpty(attachment.PreviewFileName))
				{
					filesToDelete.Add(attachment.PreviewFileName);
				}
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);
			try
			{
				_channelRepository.Remove(channel);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				foreach (var filePath in filesToDelete)
				{
					try
					{
						_fileService.DeleteFile(filePath);
					}
					catch (Exception ex)
					{
						_logger.LogError(ex, "Failed to delete file {FilePath} associated with channel ID {ChannelId}.", filePath, request.ChannelId);
					}
				}

				await _serverNotificationService.NotifyChannelRemoved(channel.ServerId, channel.Id);

				_logger.LogInformation("Channel {ChannelId} deleted in server {ServerId} by user {UserId}", channel.Id, channel.Server.Id, request.UserId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while deleting channel with ID {ChannelId}.", request.ChannelId);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;
			}
		}
	}
}
