using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Servers.IsMember
{
	internal class IsMemberQueryHandler : IRequestHandler<IsMemberQuery, bool>
	{
		private readonly ILogger<IsMemberQueryHandler> _logger;
		private readonly IServerRepository _serverRepository;
		public IsMemberQueryHandler(
			IServerRepository serverRepository,
			ILogger<IsMemberQueryHandler> logger)
		{
			_serverRepository = serverRepository;
			_logger = logger;
		}
		public async Task<bool> Handle(IsMemberQuery request, CancellationToken cancellationToken)
		{
			return await _serverRepository.IsMemberAsync(request.ServerId, request.UserId, cancellationToken);
		}
	}
}
