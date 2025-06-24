using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.ServerMessage
{
	public class SendServerMessageWithAttachmentDto
	{
		[Required]
		public Guid ChannelId { get; set; }

		[MaxLength(2000)]
		public string? Message { get; set; }

		public IFormFile? Attachment { get; set; }
	}
}
