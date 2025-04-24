using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.ServerMessage
{
	public class SendServerMessageDto
	{
		[Required]
		public string ChannelId { get; set; } = string.Empty;

		[Required]
		[MaxLength(2000)]
		public string Message { get; set; } = string.Empty;
	}
}
