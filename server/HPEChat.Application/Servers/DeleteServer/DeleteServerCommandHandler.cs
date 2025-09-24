using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using HPEChat.Application.Common.Interfaces;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Application.Common.Exceptions.Server;

namespace HPEChat.Application.Servers.DeleteServer
{
	public class DeleteServerCommandHandler : IRequestHandler<DeleteServerCommand>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IAttachmentRepository _attachmentRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IFileService _fileService;
		private readonly IServerNotificationService _serverNotificationService;
		private readonly ILogger<DeleteServerCommandHandler> _logger;
		public DeleteServerCommandHandler(
			IServerRepository serverRepository,
			IAttachmentRepository attachmentRepository,
			IUnitOfWork unitOfWork,
			IFileService fileService,
			IServerNotificationService serverNotificationService,
			ILogger<DeleteServerCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_attachmentRepository = attachmentRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		async Task IRequestHandler<DeleteServerCommand>.Handle(DeleteServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetByIdAsync(request.ServerId, cancellationToken)
				?? throw new KeyNotFoundException("Server not found.");

			if (server.OwnerId != request.OwnerId)
			{
				throw new NotAServerOwnerException();
			}

			var filesToDelete = new List<string>();

			if (!string.IsNullOrEmpty(server.Image))
			{
				filesToDelete.Add(server.Image);
			}

			var attachments = await _attachmentRepository.GetAttachmentsFromServerByIdAsync(server.Id, cancellationToken);

			foreach (var attachment in attachments)
			{
				filesToDelete.Add(attachment.StoredFileName);
				if (!string.IsNullOrEmpty(attachment.PreviewFileName))
				{
					filesToDelete.Add(attachment.PreviewFileName);
				}
			}

			var membersToNotify = server.Members.ToList();

			await _unitOfWork.BeginTransactionAsync(cancellationToken);

			try
			{
				_serverRepository.Remove(server);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				foreach (var filePath in filesToDelete)
				{
					try
					{
						_fileService.DeleteFile(filePath);
					}
					catch (Exception ex)
					{
						_logger.LogError(ex, "Failed to delete file {FilePath} associated with server ID {ServerId}.", filePath, request.ServerId);
					}
				}

				foreach (var member in membersToNotify)
				{
					await _serverNotificationService.NotifyUserLeft(request.ServerId, member.Id);

					await _serverNotificationService.RemoveUserFromGroup(member.Id, request.ServerId);
				}

				_logger.LogInformation("Server with ID {ServerId} deleted successfully by owner with ID {OwnerId}.", request.ServerId, request.OwnerId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while deleting server with ID {ServerId}. Transaction is being rolled back.", request.ServerId);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;
			}
		}
	}
}
