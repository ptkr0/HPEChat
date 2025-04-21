using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Models
{
	public class User
	{
		public required Guid Id { get; set; }
		[MaxLength(30)]
		public required string Username { get; set; } = string.Empty;
		[MaxLength(32)]
		public required string PasswordHash { get; set; } = string.Empty;
		public string Role { get; set; } = string.Empty;

		public ICollection<Server> JoinedServers { get; set; } = new List<Server>();
		public ICollection<Server> OwnedServers { get; set; } = new List<Server>();
		public ICollection<PrivateMessage> SentMessages { get; set; } = new List<PrivateMessage>();
		public ICollection<PrivateMessage> ReceivedMessages { get; set; } = new List<PrivateMessage>();
		public ICollection<ServerMessage> SentServerMessages { get; set; } = new List<ServerMessage>();
	}
}
