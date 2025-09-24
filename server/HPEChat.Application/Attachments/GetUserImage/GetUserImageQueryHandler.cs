using HPEChat.Application.Common.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Attachments.GetUserImage
{
	internal class GetUserImageQueryHandler : IRequestHandler<GetUserImageQuery, byte[]>
	{
		private readonly IUserRepository _userRepository;
		private readonly IFileService _fileService;
		private readonly ILogger<GetUserImageQueryHandler> _logger;
		public GetUserImageQueryHandler(
			IUserRepository userRepository,
			IFileService fileService,
			ILogger<GetUserImageQueryHandler> logger)
		{
			_userRepository = userRepository;
			_fileService = fileService;
			_logger = logger;
		}
		public async Task<byte[]> Handle(GetUserImageQuery request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null || user.Image == null)
			{
				_logger.LogWarning("User {UserId} not found or has no image", request.UserId);
				throw new FileNotFoundException("User not found or has no image.");
			}

			var fileBytes = await _fileService.GetByNameAsync(user.Image, cancellationToken);

			if (fileBytes == null)
			{
				_logger.LogWarning("File {FileName} not found for user {UserId}", user.Image, request.UserId);
				throw new FileNotFoundException("File not found.");
			}

			return fileBytes;
		}
	}
}
