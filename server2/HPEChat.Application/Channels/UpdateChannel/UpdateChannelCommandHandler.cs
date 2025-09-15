using HPEChat.Application.Channels.Dtos;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat_Server.Hubs;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Channels.UpdateChannel
{
	internal class UpdateChannelCommandHandler : IRequestHandler<UpdateChannelCommand, ChannelDto>
	{
		private readonly IChannelRepository _channelRepository;
		private readonly ILogger<UpdateChannelCommandHandler> _logger;
		public readonly IUnitOfWork _unitOfWork;
		private readonly IHubContext<ServerHub, IServerClient> _serverHub;
		public UpdateChannelCommandHandler(
			IChannelRepository channelRepository,
			IUnitOfWork unitOfWork,
			ILogger<UpdateChannelCommandHandler> logger,
			IHubContext<ServerHub, IServerClient> serverHub)
		{
			_channelRepository = channelRepository;
			_unitOfWork = unitOfWork;
			_logger = logger;
			_serverHub = serverHub;
		}
		public async Task<ChannelDto> Handle(UpdateChannelCommand request, CancellationToken cancellationToken)
		{
			var channel = await _channelRepository.GetByIdAsync(request.ChannelId, cancellationToken);

			if (channel == null)
			{
				_logger.LogWarning("Channel with ID {ChannelId} not found.", request.ChannelId);
				throw new ApplicationException("Channel not found.");
			}

			if (channel.Server.OwnerId != request.UserId)
			{
				_logger.LogWarning("User with ID {UserId} is not the owner of the server with ID {ServerId}. Update action denied.", request.UserId, channel.ServerId);
				throw new UnauthorizedAccessException("Only the server owner can update channels.");
			}

			await _unitOfWork.BeginTransactionAsync();
			try
			{
				channel.Name = request.Name;
				_channelRepository.Update(channel);
				await _unitOfWork.CommitTransactionAsync();

				var channelDto = new ChannelDto
				{
					Id = channel.Id,
					Name = channel.Name,
				};

				await _serverHub
					.Clients
					.Group(ServerHub.GroupName(channel.ServerId))
					.ChannelUpdated(channel.ServerId, channelDto);

				_logger.LogInformation("Channel {ChannelId} updated in server {ServerId} by user {UserId}", channel.Id, channel.Server.Id, request.UserId);

				return channelDto;
			}
			catch (Exception ex)
			{
				await _unitOfWork.RollbackTransactionAsync();
				_logger.LogError(ex, "Error updating channel {ChannelId} in server {ServerId} by user {UserId}", channel.Id, channel.Server.Id, request.UserId);
				throw;
			}
		}
	}
}
