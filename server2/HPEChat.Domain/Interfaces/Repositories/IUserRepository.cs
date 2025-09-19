using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IUserRepository
	{
		Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		Task<ICollection<User>> GetAllAsync(CancellationToken cancellationToken = default);
		Task<User?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
		Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default);
		Task AddAsync(User user, CancellationToken cancellationToken = default);
		void Update(User user);
		void Remove(User user);
	}
}
