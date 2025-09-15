using HPEChat.Domain.Enums;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using Xabe.FFmpeg;

namespace HPEChat.Infrastructure.Extensions
{
	public static class FileExtension
	{
		public static AttachmentType? CheckFile(IFormFile file)
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
				return AttachmentType.Other;

			if (validImageExtensions.Contains(extension))
			{
				return AttachmentType.Image;
			}
			else if (validVideoExtensions.Contains(extension))
			{
				return AttachmentType.Video;
			}
			else if (validMusicExtensions.Contains(extension))
			{
				return AttachmentType.Audio;
			}
			else if (validDocumentExtensions.Contains(extension))
			{
				return AttachmentType.Document;
			}
			else
			{
				return AttachmentType.Other;
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

		public static (int width, int height) GetImageDimensions(IFormFile file)
		{
			using var img = Image.Load(file.OpenReadStream());

			return (img.Width, img.Height);
		}

		public static async Task<(int width, int height)> GetVideoDimensions(string filePath)
		{
			var mediaInfo = await FFmpeg.GetMediaInfo(filePath);
			var videoStream = mediaInfo.VideoStreams.FirstOrDefault();

			if (videoStream == null)
				throw new InvalidOperationException("No video stream found in the file.");

			return (videoStream.Width, videoStream.Height);
		}
	}
}
