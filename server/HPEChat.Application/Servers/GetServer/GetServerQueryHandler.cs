using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Servers.GetServer
{
	internal class GetServerQueryHandler : IRequestHandler<GetServerQuery, ServerDto>
	{
		private readonly IServerRepository _serverRepository;
		private readonly ILogger<GetServerQueryHandler> _logger;
		public GetServerQueryHandler(
			IServerRepository serverRepository,
			ILogger<GetServerQueryHandler> logger)
		{
			_serverRepository = serverRepository;
			_logger = logger;
		}
		public async Task<ServerDto> Handle(GetServerQuery request, CancellationToken cancellationToken)
		{
			var server = await _serverRepository.GetServerWithMemebersAndChannelsAsyncNoTracking(request.ServerId, cancellationToken);

			if (server == null)
			{
				_logger.LogWarning("Server with ID {ServerId} not found.", request.ServerId);
				throw new ApplicationException("Server not found.");
			}

			if (!server.Members.Any(m => m.Id == request.UserId))
			{
				_logger.LogWarning("User with ID {UserId} is not a member of the server with ID {ServerId}.", request.UserId, request.ServerId);
				throw new ApplicationException("User is not a member of the server.");
			}

			return new ServerDto
			{
				Id = server.Id,
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId,
				Image = server.Image,
				Members = server.Members.Select(m => new UserInfoDto 
				{ 
					Id = m.Id, 
					Username = m.Username,
					Role = m.Role,
					Image = m.Image
				})
				.OrderBy(m => m.Username)
				.ToList(),
				Channels = server.Channels.Select(c => new ChannelDto 
				{ 
					Id = c.Id, 
					Name = c.Name 
				})
				.OrderBy(c => c.Name)
				.ToList()
			};
		}
	}
}
