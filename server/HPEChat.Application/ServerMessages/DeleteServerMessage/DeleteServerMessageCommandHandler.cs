using HPEChat.Application.Interfaces;
using HPEChat.Application.Interfaces.Notifications;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.ServerMessages.DeleteServerMessage
{
	internal class DeleteServerMessageCommandHandler : IRequestHandler<DeleteServerMessageCommand>
	{
		private readonly IServerMessageRepository _serverMessageRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IFileService _fileService;
		private readonly IServerNotificationService _serverNotificationService;
		private readonly ILogger<DeleteServerMessageCommandHandler> _logger;
		public DeleteServerMessageCommandHandler(
			IServerMessageRepository serverMessageRepository,
			IUnitOfWork unitOfWork,
			IFileService fileService,
			IServerNotificationService serverNotificationService,
			ILogger<DeleteServerMessageCommandHandler> logger)
		{
			_serverMessageRepository = serverMessageRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		public async Task Handle(DeleteServerMessageCommand request, CancellationToken cancellationToken)
		{
			var message = await _serverMessageRepository.GetAccessibleMessageSentByUserAsync(request.MessageId, request.UserId, cancellationToken);

			if (message == null)
			{
				_logger.LogWarning("Message with ID {MessageId} not found or user with ID {UserId} is not the sender or user can't access message.", request.MessageId, request.UserId);
				throw new KeyNotFoundException("Message not found or user is not the sender.");
			}

			// even though right now only 1 attachment is allowed per message, it could change in the future
			var filesToDelete = new List<string>();
			if (message.Attachment != null)
			{
				filesToDelete.Add(message.Attachment.StoredFileName);
				if (message.Attachment.PreviewName != null && message.Attachment.PreviewName != message.Attachment.StoredFileName)
				{
					filesToDelete.Add(message.Attachment.PreviewName);
				}
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);
			try
			{
				_serverMessageRepository.Remove(message);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				// best effort attempt to delete files, if it fails - move on :/
				foreach (var file in filesToDelete)
				{
					_fileService.DeleteFile(file);
				}

				await _serverNotificationService.NotifyMessageRemoved(message.Channel.ServerId, message.ChannelId, message.Id);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error deleting message with ID {MessageId}. Transaction is being rolled back.", request.MessageId);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;

			}
		}
	}
}
