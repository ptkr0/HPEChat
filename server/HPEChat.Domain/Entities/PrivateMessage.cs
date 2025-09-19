using System.ComponentModel.DataAnnotations;

namespace HPEChat.Domain.Entities
{
	public class PrivateMessage
	{
		public Guid Id { get; set; } = Guid.NewGuid();
		public Guid? SenderId { get; set; }
		public Guid? ReceiverId { get; set; }
		[MaxLength(2000)]
		public string? Message { get; set; }
		public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
		public bool IsRead { get; set; } = false;
		public bool IsEdited { get; set; } = false;

		public virtual User Sender { get; set; } = null!;
		public virtual User Receiver { get; set; } = null!;
	}
}
