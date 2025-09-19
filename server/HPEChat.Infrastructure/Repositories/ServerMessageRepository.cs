using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	public class ServerMessageRepository : IServerMessageRepository
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

		public async Task<ServerMessage?> GetAccessibleMessageSentByUserAsync(Guid messageId, Guid userId, CancellationToken cancellationToken = default)
		{
			return await _context.ServerMessages
				.Include(u => u.Sender)
				.Include(s => s.Channel.Server)
				.Include(a => a.Attachment)
				.FirstOrDefaultAsync(m =>
					m.Id == messageId && // check if message exists
					m.SenderId == userId && // check if the user is the sender
					m.Channel.Server.Members.Any(u => u.Id == userId), cancellationToken); // check if the user is still a member of the server
		}

		public async Task<ServerMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.ServerMessages.FindAsync([id], cancellationToken);
		}

		public async Task<ICollection<ServerMessage>> GetMessagesWithAttachmentsOlderThanAsync(Guid channelId, DateTimeOffset? before, int pageSize = 50, CancellationToken cancellationToken = default)
		{
			var messages = await _context.ServerMessages
					.AsNoTracking()
					.Include(m => m.Attachment)
					.Include(m => m.Sender)
					.Where(m => m.ChannelId == channelId &&
								(!before.HasValue || m.SentAt < before.Value))
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
