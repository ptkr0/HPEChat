using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Common.Exceptions.Server;
using HPEChat.Application.Common.Interfaces.Notifications;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Channels.CreateChannel
{
	internal class CreateChannelCommandHandler : IRequestHandler<CreateChannelCommand, ChannelDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IChannelRepository _channelRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<CreateChannelCommandHandler> _logger;
		private readonly IServerNotificationService _serverNotificationService;
		public CreateChannelCommandHandler(
			IServerRepository serverRepository,
			IChannelRepository channelRepository,
			IUnitOfWork unitOfWork,
			IServerNotificationService serverNotificationService,
			ILogger<CreateChannelCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_channelRepository = channelRepository;
			_unitOfWork = unitOfWork;
			_serverNotificationService = serverNotificationService;
			_logger = logger;
		}
		public async Task<ChannelDto> Handle(CreateChannelCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetByIdAsync(request.ServerId, cancellationToken)
				?? throw new KeyNotFoundException("Server not found.");

			if (server.OwnerId != request.UserId)
			{
				throw new NotAServerOwnerException();
			}

			await _unitOfWork.BeginTransactionAsync(cancellationToken);
			try
			{
				var channel = new Channel
				{
					Name = request.Name,
					ServerId = request.ServerId,
				};

				await _channelRepository.AddAsync(channel, cancellationToken);
				await _unitOfWork.CommitTransactionAsync(cancellationToken);

				var channelDto = new ChannelDto
				{
					Id = channel.Id,
					Name = channel.Name,
				};

				await _serverNotificationService.NotifyChannelAdded(server.Id, channelDto);

				_logger.LogInformation("Channel {ChannelId} created in server {ServerId} by user {UserId}", channel.Id, server.Id, request.UserId);

				return channelDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while creating channel in server with ID {ServerId}.", request.ServerId);
				await _unitOfWork.RollbackTransactionAsync(cancellationToken);
				throw;
			}
		}
	}
}
