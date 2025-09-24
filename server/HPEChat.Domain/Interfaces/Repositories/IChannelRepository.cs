using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IChannelRepository
	{
		Task<Channel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		Task AddAsync(Channel channel, CancellationToken cancellationToken = default);
		void Update(Channel channel);
		void Remove(Channel channel);
		Task<bool> CanAccessChannel(Guid channelId, Guid userId, CancellationToken cancellationToken = default);
		Task<Guid?> GetServerIdByChannelIdAsync(Guid channelId, CancellationToken cancellationToken = default);
	}
}
