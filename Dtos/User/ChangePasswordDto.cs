using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.User
{
	public class ChangePasswordDto
	{
		[Required]
		[MaxLength(100)]
		public string OldPassword { get; set; } = string.Empty;

		[Required]
		[MaxLength(100)]
		public string NewPassword { get; set; } = string.Empty;
	}
}
