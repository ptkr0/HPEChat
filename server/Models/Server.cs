using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Models
{
	public class Server
	{
		public Guid Id { get; set; } = Guid.NewGuid();
		public required Guid OwnerId { get; set; }
		[MaxLength(50)]
		public required string Name { get; set; } = string.Empty;
		[MaxLength(1000)]
		public string Description { get; set; } = string.Empty;
		public string Image { get; set; } = string.Empty;

		public ICollection<User> Members { get; set; } = new List<User>();
		public virtual User Owner { get; set; } = null!;

		public ICollection<Channel> Channels { get; set; } = new List<Channel>();
	}
}
