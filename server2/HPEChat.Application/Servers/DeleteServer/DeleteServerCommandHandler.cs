using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using HPEChat_Server.Services;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.DeleteServer
{
	public class DeleteServerCommandHandler : IRequestHandler<DeleteServerCommand>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IAttachmentRepository _attachmentRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly Services.FileService _fileService;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		private readonly ConnectionMapperService _connectionMapperService;
		private readonly ILogger<DeleteServerCommandHandler> _logger;
		public DeleteServerCommandHandler(
			IServerRepository serverRepository,
			IAttachmentRepository attachmentRepository,
			IUnitOfWork unitOfWork,
			Services.FileService fileService,
			IHubContext<ServerHub, IServerClient> serverHub,
			ConnectionMapperService connectionMapperService,
			ILogger<DeleteServerCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_attachmentRepository = attachmentRepository;
			_unitOfWork = unitOfWork;
			_fileService = fileService;
			_serverHub = serverHub;
			_connectionMapperService = connectionMapperService;
			_logger = logger;
		}
		async Task IRequestHandler<DeleteServerCommand>.Handle(DeleteServerCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetByIdAsync(request.ServerId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found for deletion.", request.ServerId);
				throw new KeyNotFoundException("Server not found.");
			}

			if (server.OwnerId != request.OwnerId)
			{
				_logger.LogWarning("User with ID {OwnerId} is not the owner of server with ID {ServerId}. Deletion denied.", request.OwnerId, request.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can delete the server.");
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

			await _unitOfWork.BeginTransactionAsync();

			try
			{
				_serverRepository.Remove(server);

				await _unitOfWork.CommitTransactionAsync();

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
					await _serverHub.Clients.Group(ServerHub.GroupName(server.Id))
						.UserLeft(server.Id, member.Id);

					var connectionIds = _connectionMapperService.GetConnections(member.Id);
					foreach (var connId in connectionIds)
						await _serverHub.Groups.RemoveFromGroupAsync(connId, ServerHub.GroupName(server.Id));
				}

				_logger.LogInformation("Server with ID {ServerId} deleted successfully by owner with ID {OwnerId}.", request.ServerId, request.OwnerId);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while deleting server with ID {ServerId}. Transaction is being rolled back.", request.ServerId);
				_unitOfWork.RollbackTransaction();
				throw;
			}
		}
	}
}
