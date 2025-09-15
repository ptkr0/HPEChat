using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.Channels.Dtos
{
	public class CreateChannelDto
	{
		[Required]
		public Guid ServerId { get; set; }

		[Required]
		[MaxLength(50)]
		public string Name { get; set; } = string.Empty;
	}
}
