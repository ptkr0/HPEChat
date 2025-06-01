namespace HPEChat_Server.Dtos.User
{
	public class ReturnLoginDto
	{
		public Guid Id { get; set; }
		public string Username { get; set; } = string.Empty;
		public string Token { get; set; } = string.Empty;
		public string Role { get; set; } = string.Empty;
		public string Image { get; set; } = string.Empty;
	}
}
