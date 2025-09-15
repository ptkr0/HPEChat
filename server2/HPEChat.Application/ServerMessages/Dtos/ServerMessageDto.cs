using HPEChat.Application.Users.Dtos;


namespace HPEChat.Application.ServerMessages.Dtos
{
	public class ServerMessageDto
	{
		public string Id { get; set; } = string.Empty;
		public string ChannelId { get; set; } = string.Empty;
		public string Message { get; set; } = string.Empty;
		public DateTimeOffset SentAt { get; set; }
		public bool IsEdited { get; set; }
		public UserInfoDto Sender { get; set; } = new UserInfoDto();
		public AttachmentDto? Attachment { get; set; }
	}
}
