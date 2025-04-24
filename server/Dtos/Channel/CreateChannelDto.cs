using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.Channel
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
