using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.Server
{
	public class CreateServerDto
	{
		[Required]
		[MaxLength(50)]
		public string Name { get; set; } = string.Empty;

		[MaxLength(1000)]
		public string Description { get; set; } = string.Empty;
	}
}
