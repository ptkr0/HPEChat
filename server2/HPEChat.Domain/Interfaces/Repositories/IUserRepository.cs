using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IUserRepository
	{
		Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		Task AddAsync(User user, CancellationToken cancellationToken = default);
		void Update(User user);
		void Remove(User user);
	}
}
