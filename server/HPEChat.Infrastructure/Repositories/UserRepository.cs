using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	public class UserRepository : IUserRepository
	{
		private readonly ApplicationDBContext _context;
		public UserRepository(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task AddAsync(User user, CancellationToken cancellationToken = default)
		{
			await _context.Users.AddAsync(user, cancellationToken);
		}

		public async Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default)
		{
			return await _context.Users.AnyAsync(u => u.Username == username, cancellationToken);
		}

		public async Task<ICollection<User>> GetAllAsync(CancellationToken cancellationToken = default)
		{
			return await _context.Users.ToListAsync(cancellationToken);
		}

		public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Users.FindAsync([id], cancellationToken);
		}

		public Task<User?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
		{
			return _context.Users.FirstOrDefaultAsync(u => u.Username == name, cancellationToken);
		}

		public void Remove(User user)
		{
			_context.Users.Remove(user);
		}

		public void Update(User user)
		{
			_context.Users.Update(user);
		}
	}
}
