using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Models
{
	public enum AttachmentType
	{
		Image,
		Video,
		Audio,
		Document,
		Other
	}

	public class Attachment
	{
		public Guid Id { get; set; } = Guid.NewGuid();
		public Guid? ServerMessageId { get; set; }

		[MaxLength(255)]
		public string Name { get; set; } = string.Empty;
		public string StoredFileName { get; set; } = string.Empty;
		public required DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
		public long Size { get; set; } = 0;
		public AttachmentType ContentType { get; set; } = AttachmentType.Other;

		public int? Width { get; set; }
		public int? Height { get; set; }

		public virtual ServerMessage? ServerMessage { get; set; }
	}
}
