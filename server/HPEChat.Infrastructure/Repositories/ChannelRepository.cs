using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	public class ChannelRepository : IChannelRepository
	{
		private readonly ApplicationDBContext _context;
		public ChannelRepository(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task AddAsync(Channel channel, CancellationToken cancellationToken = default)
		{
			await _context.Channels.AddAsync(channel, cancellationToken);
		}

		public Task<bool> CanAccessChannel(Guid channelId, Guid userId, CancellationToken cancellationToken = default)
		{
			return _context.Channels
				.AsNoTracking()
				.Where(c => c.Id == channelId)
				.AnyAsync(c => c.Server.Members.Any(m => m.Id == userId), cancellationToken);
		}

		public async Task<Channel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Channels
				.Include(s => s.Server)
				.ThenInclude(c => c.Members)
				.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
		}

		public async Task<Guid?> GetServerIdByChannelIdAsync(Guid channelId, CancellationToken cancellationToken = default)
		{
			return await _context.Channels
				.AsNoTracking()
				.Where(c => c.Id == channelId)
				.Select(c => c.ServerId)
				.FirstOrDefaultAsync(cancellationToken);
		}

		public void Remove(Channel channel)
		{
			_context.Channels.Remove(channel);
		}

		public void Update(Channel channel)
		{
			_context.Channels.Update(channel);
		}
	}
}
