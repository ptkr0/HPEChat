using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	internal class ChannelRepository : IChannelRepository
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

		public async Task<Channel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Channels
			.Include(s => s.Server)
			.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
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
