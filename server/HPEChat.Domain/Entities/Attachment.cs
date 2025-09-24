using HPEChat.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Domain.Entities
{
	public class Attachment
	{
		public Guid Id { get; set; } = Guid.NewGuid();
		public Guid? ServerMessageId { get; set; }
		[MaxLength(255)]
		public string Name { get; set; } = string.Empty;
		public string StoredFileName { get; set; } = string.Empty;
		public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
		public long Size { get; set; } = 0;
		public AttachmentType ContentType { get; set; } = AttachmentType.Other;

		public int? Width { get; set; }
		public int? Height { get; set; }

		public string? PreviewName { get; set; } = string.Empty;

		public virtual ServerMessage? ServerMessage { get; set; }
	}
}
