using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	public class ServerRepository : IServerRepository
	{
		private readonly ApplicationDBContext _context;
		public ServerRepository(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task AddAsync(Server server, CancellationToken cancellationToken = default)
		{
			await _context.Servers.AddAsync(server, cancellationToken);
		}

		public async Task<Server?> CanAccessByIdAsync(Guid serverId, Guid userId, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.AsNoTracking()
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id == serverId && s.Members.Any(u => u.Id == userId), cancellationToken);
		}

		public async Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default)
		{
			return await _context.Servers.AnyAsync(s => s.Name.ToUpper() == name.ToUpper(), cancellationToken);
		}

		public async Task<Server?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.FindAsync([id], cancellationToken);
		}

		public async Task<Server?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.FirstOrDefaultAsync(s => s.Name.ToUpper() == name.ToUpper(), cancellationToken);
		}

		public async Task<ICollection<Server>> GetServersByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.Where(s => s.Members.Any(u => u.Id == userId))
				.OrderBy(s => s.Name)
				.AsNoTracking()
				.ToListAsync(cancellationToken);
		}

		public async Task<Server?> GetServerWithMemebersAndChannelsAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.AsSplitQuery()
				.Include(s => s.Members)
				.Include(s => s.Channels)
				.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
		}

		public async Task<Server?> GetServerWithMemebersAndChannelsAsyncNoTracking(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.AsSplitQuery()
				.AsNoTracking()
				.Include(s => s.Members)
				.Include(s => s.Channels)
				.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
		}

		public async Task<Server?> GetServerWithMemebersAndChannelsByNameAsync(string name, CancellationToken cancellationToken = default)
		{
			return await _context.Servers
				.AsSplitQuery()
				.Include(s => s.Members)
				.Include(s => s.Channels)
				.FirstOrDefaultAsync(s => s.Name == name, cancellationToken);
		}

		public void Remove(Server server)
		{
			_context.Remove(server);
		}

		public void Update(Server server)
		{
			_context.Update(server);
		}
	}
}
