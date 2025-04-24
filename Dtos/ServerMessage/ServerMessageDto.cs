namespace HPEChat_Server.Dtos.ServerMessage
{
	public class ServerMessageDto
	{
		public string Id { get; set; } = string.Empty;
		public string ChannelId { get; set; } = string.Empty;
		public string SenderId { get; set; } = string.Empty;
		public string Message { get; set; } = string.Empty;
		public DateTimeOffset SentAt { get; set; }
		public bool IsEdited { get; set; }

	}
}
