using HPEChat.Application.Attachments.GetAttachment;
using HPEChat.Application.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Attachments.GetPreview
{
	internal class GetPreviewQueryHandler : IRequestHandler<GetPreviewQuery, byte[]>
	{
		private readonly IAttachmentRepository _attachmentRepository;
		private readonly ILogger<GetPreviewQueryHandler> _logger;
		private readonly IFileService _fileService;
		public GetPreviewQueryHandler(
			IAttachmentRepository attachmentRepository,
			ILogger<GetPreviewQueryHandler> logger,
			IFileService fileService)
		{
			_attachmentRepository = attachmentRepository;
			_logger = logger;
			_fileService = fileService;
		}
		public async Task<byte[]> Handle(GetPreviewQuery request, CancellationToken cancellationToken)
		{
			var canAccess = await _attachmentRepository.CheckIfUserCanAccessAsync(request.UserId, request.FileName, cancellationToken);

			if (!canAccess)
			{
				_logger.LogWarning("User {UserId} tried to access file {FileName} without permission", request.UserId, request.FileName);
				throw new UnauthorizedAccessException("You do not have permission to access this file.");
			}

			var fileBytes = await _fileService.GetByNameAsync(request.FileName, cancellationToken);

			if (fileBytes == null)
			{
				_logger.LogWarning("File {FileName} not found for user {UserId}", request.FileName, request.UserId);
				throw new FileNotFoundException("File not found.");
			}

			return fileBytes;
		}
	}
}
