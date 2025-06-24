using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Models
{
	public class ServerMessage
	{
		public Guid Id { get; set; } = Guid.NewGuid();
		public Guid ChannelId { get; set; }
		public Guid? SenderId { get; set; }
		[MaxLength(2000)]
		public string? Message { get; set; }
		public required DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
		public bool IsEdited { get; set; } = false;

		public virtual Channel Channel { get; set; } = null!;
		public virtual User Sender { get; set; } = null!;

		public virtual Attachment? Attachment { get; set; } = null!;
	}
}
