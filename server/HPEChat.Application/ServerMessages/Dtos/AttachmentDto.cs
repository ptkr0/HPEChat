using HPEChat.Domain.Enums;

namespace HPEChat.Application.ServerMessages.Dtos
{
	public class AttachmentDto
	{
		public Guid Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public string Type { get; set; } = string.Empty;
		public long Size { get; set; }
		public int? Width { get; set; }
		public int? Height { get; set; }

		public string? FileName { get; set; } = string.Empty;
		public string? PreviewName { get; set; } = string.Empty;
	}
}
