using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces.Repositories;
using HPEChat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HPEChat.Infrastructure.Repositories
{
	public class AttachmentRepository : IAttachmentRepository
	{
		private readonly ApplicationDBContext _context;
		public AttachmentRepository(ApplicationDBContext context)
		{
			_context = context;
		}
		public async Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default)
		{
			await _context.Attachments.AddAsync(attachment, cancellationToken);
		}

		public async Task<ICollection<IAttachmentRepository.FileInfo>> GetAttachmentsFromChannelByIdAsync(Guid channelId, CancellationToken cancellationToken = default)
		{
			return await _context.Attachments
				.AsNoTracking()
				.Where(a => a.ServerMessage!.ChannelId == channelId)
				.Select(a => new IAttachmentRepository.FileInfo(a.StoredFileName, a.PreviewName))
				.ToListAsync(cancellationToken);
		}

		public async Task<ICollection<IAttachmentRepository.FileInfo>> GetAttachmentsFromServerByIdAsync(Guid serverId, CancellationToken cancellationToken = default)
		{
			return await _context.Attachments
				.AsNoTracking()
				.Where(a => a.ServerMessage!.Channel.ServerId == serverId)
				.Select(a => new IAttachmentRepository.FileInfo(a.StoredFileName, a.PreviewName))
				.ToListAsync(cancellationToken);
		}

		public async Task<bool> CheckIfUserCanAccessAsync(Guid userId, string fileName, CancellationToken cancellationToken = default)
		{
			return await _context.Attachments
				.AsNoTracking()
				.AnyAsync(a =>
					(a.StoredFileName == fileName || a.PreviewName == fileName)
					&&
					a.ServerMessage!.Channel.Server.Members
					 .Any(m => m.Id == userId),
					 cancellationToken
				);
		}

		public async Task<Attachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
		{
			return await _context.Attachments.FindAsync([id], cancellationToken);
		}

		public void Remove(Attachment attachment)
		{
			_context.Attachments.Remove(attachment);
		}
	}
}
