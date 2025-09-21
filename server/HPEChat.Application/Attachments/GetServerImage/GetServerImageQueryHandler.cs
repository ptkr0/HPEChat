using HPEChat.Application.Attachments.GetAttachment;
using HPEChat.Application.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Attachments.GetServerImage
{
	internal class GetServerImageQueryHandler : IRequestHandler<GetServerImageQuery, byte[]>
	{
		private readonly IServerRepository _serverRepository;
		private readonly ILogger<GetServerImageQueryHandler> _logger;
		private readonly IFileService _fileService;
		public GetServerImageQueryHandler(
			IServerRepository serverRepository,
			ILogger<GetServerImageQueryHandler> logger,
			IFileService fileService)
		{
			_serverRepository = serverRepository;
			_logger = logger;
			_fileService = fileService;
		}
		public async Task<byte[]> Handle(GetServerImageQuery request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.CanAccessByIdAsync(request.ServerId, request.UserId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("User {UserId} tried to access server icon for {ServerId} without permission", request.UserId, request.ServerId);
				throw new UnauthorizedAccessException("You do not have permission to access this file.");
			}

			var fileBytes = await _fileService.GetByNameAsync(server.Image, cancellationToken);

			if (fileBytes == null)
			{
				_logger.LogWarning("File {FileName} not found", server.Image);
				throw new FileNotFoundException("File not found.");
			}

			return fileBytes;
		}
	}
}
