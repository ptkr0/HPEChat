using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces.Repositories
{
	public interface IAttachmentRepository
	{
		Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default);
		Task<Attachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
		Task<bool> CheckIfUserCanAccessAsync(Guid userId, string fileName, CancellationToken cancellationToken = default);
		void Remove(Attachment attachment);
		public record FileInfo(string StoredFileName, string? PreviewFileName);
		Task<ICollection<FileInfo>> GetAttachmentsFromServerByIdAsync(Guid serverId, CancellationToken cancellationToken = default);
		Task<ICollection<FileInfo>> GetAttachmentsFromChannelByIdAsync(Guid channelId, CancellationToken cancellationToken = default);
	}
}
