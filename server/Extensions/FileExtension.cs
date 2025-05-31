namespace HPEChat_Server.Extensions
{
	public static class FileExtension
	{
		public static string? CheckFile(IFormFile file)
		{
			List<string> validImageExtensions = new List<string>() { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif" };
			List<string> validVideoExtensions = new List<string>() { ".mp4", ".webm", ".avi", ".mov", ".mkv" };
			List<string> validMusicExtensions = new List<string>() { ".mp3", ".wav", ".ogg", ".flac" };
			List<string> validDocumentExtensions = new List<string>() { ".pdf", ".docx", ".txt", ".xlsx", ".pptx" };

			long MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

			if (file.Length > MAX_FILE_SIZE) return null;

			var fileName = file.FileName;
			var extension = Path.GetExtension(fileName)?.ToLowerInvariant();

			if (string.IsNullOrEmpty(extension))
				return "other";

			if (validImageExtensions.Contains(extension))
			{
				return "image";
			}
			else if (validVideoExtensions.Contains(extension))
			{
				return "video";
			}
			else if (validMusicExtensions.Contains(extension))
			{
				return "music";
			}
			else if (validDocumentExtensions.Contains(extension))
			{
				return "document";
			}
			else
			{
				return "other";
			}
		}

		public static bool IsValidAvatar(IFormFile file)
		{
			List<string> validAvatarExtensions = new List<string>() { ".jpg", ".jpeg", ".png", ".webp" };
			long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

			if (file.Length > MAX_AVATAR_SIZE) return false;

			var fileName = file.FileName;
			var extension = Path.GetExtension(fileName)?.ToLowerInvariant();

			if (string.IsNullOrEmpty(extension))
				return false;

			return validAvatarExtensions.Contains(extension);
		}
	}
}
