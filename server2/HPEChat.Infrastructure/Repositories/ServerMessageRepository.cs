using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	internal class ServerMessageRepository : IServerMessageRepository
	{
		private readonly ApplicationDBContext _context;
		public ServerMessageRepository(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task AddAsync(ServerMessage serverMessage, CancellationToken cancellationToken = default)
		{
			await _context.ServerMessages.AddAsync(serverMessage, cancellationToken);
		}

		public async Task<ServerMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.ServerMessages.FindAsync([id], cancellationToken);
		}

		public async Task<ICollection<ServerMessage>> GetMessagesWithAttachmentsOlderThanAsync(Guid channelId, DateTimeOffset? lastCreatedAt, int pageSize = 50, CancellationToken cancellationToken = default)
		{
			var messages = await _context.ServerMessages
					.AsNoTracking()
					.Include(m => m.Attachment)
					.Where(m => m.ChannelId == channelId &&
								(!lastCreatedAt.HasValue || m.SentAt < lastCreatedAt.Value))
					.OrderByDescending(m => m.SentAt)
					.ThenByDescending(m => m.Id)
					.Take(pageSize)
					.ToListAsync(cancellationToken);

			return messages;
		}

		public void Remove(ServerMessage serverMessage)
		{
			throw new NotImplementedException();
		}

		public void Update(ServerMessage serverMessage)
		{
			throw new NotImplementedException();
		}
	}
}
