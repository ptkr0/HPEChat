using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Models
{
	public class Channel
	{
		public required Guid Id { get; set; } = Guid.NewGuid();
		public required Guid ServerId { get; set; }
		[MaxLength(50)]
		public required string Name { get; set; } = string.Empty;

		public virtual Server Server { get; set; } = null!;
		public ICollection<ServerMessage> Messages { get; set; } = new List<ServerMessage>();
	}
}
