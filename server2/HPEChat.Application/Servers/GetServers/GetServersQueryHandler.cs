using HPEChat.Application.Servers.Dtos;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HPEChat.Application.Servers.GetServers
{
	internal class GetServersQueryHandler : IRequestHandler<GetServersQuery, ICollection<ServerDto>>
	{
		private readonly IServerRepository _serverRepository;
		private readonly ILogger<GetServersQueryHandler> _logger;
		public GetServersQueryHandler(
			IServerRepository serverRepository,
			ILogger<GetServersQueryHandler> logger)
		{
			_serverRepository = serverRepository;
			_logger = logger;
		}
		public async Task<ICollection<ServerDto>> Handle(GetServersQuery request, CancellationToken cancellationToken)
		{
			var servers = await _serverRepository.GetServersByUserIdAsync(request.UserId, cancellationToken);

			return servers.Select(server => new ServerDto
			{
				Id = server.Id,
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId,
				Image = server.Image
			})
			.OrderBy(s => s.Name)
			.ToList();
		}
	}
}
