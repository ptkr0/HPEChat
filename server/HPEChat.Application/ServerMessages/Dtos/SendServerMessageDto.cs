using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.ServerMessages.Dtos
{
	public class SendServerMessageDto
	{
		[Required]
		public Guid ChannelId { get; set; }

		[Required]
		[MaxLength(2000)]
		public string Message { get; set; } = string.Empty;
	}
}
