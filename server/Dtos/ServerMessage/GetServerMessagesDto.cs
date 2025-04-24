using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.ServerMessage
{
	public class GetServerMessagesDto
	{
		[Required]
		public Guid ChannelId { get; set; }
		public DateTimeOffset? LastCreatedAt { get; set; }
	}
}
