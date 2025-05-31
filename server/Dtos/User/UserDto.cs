using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Dtos.User
{
	public class UserDto
	{
		[Required]
		[MaxLength(30)]
		public string Username { get; set; } = string.Empty;

		[Required]
		[MaxLength(200)]
		public string Password { get; set; } = string.Empty;

		public IFormFile? Image { get; set; }
	}
}
