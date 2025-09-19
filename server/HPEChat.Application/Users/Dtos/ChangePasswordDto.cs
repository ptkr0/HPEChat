using System.ComponentModel.DataAnnotations;

namespace HPEChat.Application.Users.Dtos
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
