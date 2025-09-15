using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IServerMessageRepository
	{
		Task AddAsync(ServerMessage serverMessage, CancellationToken cancellationToken = default);
		Task<ServerMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		void Update(ServerMessage serverMessage);
		void Remove(ServerMessage serverMessage);
		Task<ICollection<ServerMessage>> GetMessagesWithAttachmentsOlderThanAsync(Guid channelId, DateTimeOffset? lastCreatedAt, int pageSize = 50, CancellationToken cancellationToken = default);
	}
}
