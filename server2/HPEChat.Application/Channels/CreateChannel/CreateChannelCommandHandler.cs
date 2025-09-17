using HPEChat.Application.Channels.Dtos;
using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Channels.CreateChannel
{
	internal class CreateChannelCommandHandler : IRequestHandler<CreateChannelCommand, ChannelDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly IChannelRepository _channelRepository;
		private readonly IUnitOfWork _unitOfWork;
		private readonly ILogger<CreateChannelCommandHandler> _logger;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		public CreateChannelCommandHandler(
			IServerRepository serverRepository,
			IChannelRepository channelRepository,
			IUnitOfWork unitOfWork,
			IHubContext<ServerHub, IServerClient> serverHub,
			ILogger<CreateChannelCommandHandler> logger)
		{
			_serverRepository = serverRepository;
			_channelRepository = channelRepository;
			_unitOfWork = unitOfWork;
			_serverHub = serverHub;
			_logger = logger;
		}
		public async Task<Dtos.ChannelDto> Handle(CreateChannelCommand request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetByIdAsync(request.ServerId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found when trying to create a channel.", request.ServerId);
				throw new ApplicationException("Server not found.");
			}

			if (server.OwnerId != request.UserId)
			{
				_logger.LogWarning("User with ID {UserId} is not the owner of server with ID {ServerId}. Channel creation denied.", request.UserId, request.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can create channels.");
			}

			await _unitOfWork.BeginTransactionAsync();
			try
			{
				var channel = new Channel
				{
					Name = request.Name,
					ServerId = request.ServerId,
				};

				await _channelRepository.AddAsync(channel, cancellationToken);
				await _unitOfWork.CommitTransactionAsync();

				var channelDto = new ChannelDto
				{
					Id = channel.Id,
					Name = channel.Name,
				};

				await _serverHub
						.Clients
						.Group(ServerHub.GroupName(server.Id))
						.ChannelAdded(server.Id, new ChannelDto
						{
							Id = channel.Id,
							Name = channel.Name,
						});

				_logger.LogInformation("Channel {ChannelId} created in server {ServerId} by user {UserId}", channel.Id, server.Id, request.UserId);

				return channelDto;
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Error occurred while creating channel in server with ID {ServerId}.", request.ServerId);
				await _unitOfWork.RollbackTransactionAsync();
				throw;
			}
		}
	}
}
