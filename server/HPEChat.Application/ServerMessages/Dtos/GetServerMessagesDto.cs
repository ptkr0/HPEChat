using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.ServerMessages.Dtos
{
	public class GetServerMessagesDto
	{
		[Required]
		public Guid ChannelId { get; set; }
		public DateTimeOffset? LastCreatedAt { get; set; }
	}
}
