using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.ServerMessages.GetServerMessages
{
	internal class GetServerMessagesQueryHandler : IRequestHandler<GetServerMessagesQuery, ICollection<ServerMessageDto>>
	{
		private readonly IChannelRepository _channelRepository;
		private readonly IServerMessageRepository _serverMessageRepository;
		private readonly ILogger<GetServerMessagesQueryHandler> _logger;
		public GetServerMessagesQueryHandler(
			IChannelRepository channelRepository,
			IServerMessageRepository serverMessageRepository,
			ILogger<GetServerMessagesQueryHandler> logger)
		{
			_channelRepository = channelRepository;
			_serverMessageRepository = serverMessageRepository;
			_logger = logger;
		}
		public async Task<ICollection<ServerMessageDto>> Handle(GetServerMessagesQuery request, CancellationToken cancellationToken)
		{
			var canAccessChannel = await _channelRepository.CanAccessChannel(request.ChannelId, request.UserId, cancellationToken);

			if (!canAccessChannel)
			{
				_logger.LogWarning("User with ID {UserId} cannot access channel with ID {ChannelId}.", request.UserId, request.ChannelId);
				throw new UnauthorizedAccessException("User cannot access this channel.");
			}

			var messages = await _serverMessageRepository.GetMessagesWithAttachmentsOlderThanAsync(request.ChannelId, request.Before, request.PageSize, cancellationToken);

			return messages.Select(m => new ServerMessageDto
			{
				Id = m.Id,
				ChannelId = m.ChannelId,
				Message = m.Message ?? string.Empty,
				SentAt = m.SentAt,
				IsEdited = m.IsEdited,
				Sender = m.Sender != null ? new UserInfoDto
				{
					Id = m.Sender.Id,
					Username = m.Sender.Username,
					Image = m.Sender.Image ?? string.Empty,
				} : new UserInfoDto
				{
					Id = Guid.Empty,
					Username = string.Empty,
					Image = string.Empty,
				},
				Attachment = m.Attachment != null ? new AttachmentDto
				{
					Id = m.Attachment.Id,
					Name = m.Attachment.Name,
					Type = m.Attachment.ContentType.ToString(),
					Size = m.Attachment.Size,
					Width = m.Attachment.Width,
					Height = m.Attachment.Height,
					FileName = m.Attachment.StoredFileName,
					PreviewName = m.Attachment.PreviewName ?? string.Empty
				} : null
			}).ToList();
		}
	}
}
