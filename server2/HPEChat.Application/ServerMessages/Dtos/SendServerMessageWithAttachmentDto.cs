using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.ServerMessages.Dtos
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
