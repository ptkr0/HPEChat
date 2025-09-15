namespace HPEChat.Application.Users.Dtos
{
	public class UserInfoDto
	{
		public Guid Id { get; set; }
		public string Username { get; set; } = string.Empty;
		public string Role { get; set; } = string.Empty;
		public string Image { get; set; } = string.Empty;
	}
}
