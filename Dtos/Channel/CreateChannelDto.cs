using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.Channel
{
	public class CreateChannelDto
	{
		[Required]
		public string ServerId { get; set; } = string.Empty;

		[Required]
		[MaxLength(50)]
		public string Name { get; set; } = string.Empty;
	}
}
