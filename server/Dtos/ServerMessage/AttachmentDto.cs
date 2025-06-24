using HPEChat_Server.Models;

namespace HPEChat_Server.Dtos.ServerMessage
{
	public class AttachmentDto
	{
		public string Id { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string Type { get; set; } = string.Empty;
		public long Size { get; set; }
		public int? Width { get; set; }
		public int? Height { get; set; }
	}
}
