using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Application.ServerMessages.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.ServerMessages.UpdateServerMessage
{
	internal class UpdateServerMessageCommandHandler : IRequestHandler<UpdateServerMessageCommand, ServerMessageDto>
	{
		private readonly IServerMessageRepository _serverMessageRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly IServerNotificationService _serverNotificationService;
		private readonly ILogger<UpdateServerMessageCommandHandler> _logger;
		public UpdateServerMessageCommandHandler(
			IServerMessageRepository serverMessageRepository,
			IUnitOfWork unitOfWork,
			IServerNotificationService serverNotificationService,
			ILogger<UpdateServerMessageCommandHandler> logger)
		{
			_serverMessageRepository = serverMessageRepository;
			_unitOfWork = unitOfWork;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		public async Task<ServerMessageDto> Handle(UpdateServerMessageCommand request, CancellationToken cancellationToken)
		{
			var message = await _serverMessageRepository.GetAccessibleMessageSentByUserAsync(request.MessageId, request.UserId, cancellationToken)
				?? throw new KeyNotFoundException("Message not found or you do not have permission to edit it.");

			await _unitOfWork.BeginTransactionAsync(cancellationToken);
			try
			{
				message.Message = request.NewMessage;
				message.IsEdited = true;

				_serverMessageRepository.Update(message);
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
				};

				await _serverNotificationService.NotifyMessageEdited(message.Channel.ServerId, messageDto);

				return messageDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error updating message with ID {MessageId}. Transaction is being rolled back.", request.MessageId);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;
			}
		}
	}
}
