using HPEChat.Application.Users.Dtos;


namespace HPEChat.Application.ServerMessages.Dtos
{
	public class ServerMessageDto
	{
		public Guid Id { get; set; }
		public Guid ChannelId { get; set; }
		public string Message { get; set; } = string.Empty;
		public DateTimeOffset SentAt { get; set; }
		public bool IsEdited { get; set; }
		public UserInfoDto Sender { get; set; } = new UserInfoDto();
		public AttachmentDto? Attachment { get; set; }
	}
}
