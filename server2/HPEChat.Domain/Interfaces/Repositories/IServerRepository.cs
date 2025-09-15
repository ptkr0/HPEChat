using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IServerRepository
	{
		Task<Server?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		Task<Server?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
		Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);
		Task AddAsync(Server server, CancellationToken cancellationToken = default);
		void Update(Server server);
		void Remove(Server server);
		Task<Server?> GetServerWithMemebersAndChannelsAsync(Guid id, CancellationToken cancellationToken = default);
		Task<ICollection<Server>> GetServersByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
	}
}
