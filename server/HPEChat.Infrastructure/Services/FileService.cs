using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using HPEChat.Domain.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using HPEChat.Application.Common.Interfaces;

namespace HPEChat.Infrastructure.Services
{
	public class FileService : IFileService
	{
		private readonly FileStorageSettings _fileStorageSettings;
		public FileService(IOptions<FileStorageSettings> fileStorageSettings)
		{
			_fileStorageSettings = fileStorageSettings.Value;
		}

		public async Task<string> UploadFile(IFormFile file, CancellationToken cancellationToken)
		{
			string randomString = Guid.NewGuid().ToString("n").Substring(0, 8);
			var fileName = $"{randomString}_{Path.GetFileName(file.FileName)}";
			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream, cancellationToken);
			}

			return fileName;
		}

		public bool DeleteFile(string fileName)
		{
			try
			{
				string filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

				if (!File.Exists(filePath))
					return true; // already "deleted"  

				File.Delete(filePath);
				return true;
			}
			catch
			{
				return false; // deletion failed for some reason (in use, permissions, etc.)  
			}
		}

		public async Task<string> UploadAvatar(IFormFile file, Guid userId, CancellationToken cancellationToken)
		{
			using (var image = await Image.LoadAsync(file.OpenReadStream()))
			{
				image.Metadata.ExifProfile = null;
				image.Metadata.IptcProfile = null;
				image.Metadata.XmpProfile = null;

				int height = image.Height > 100 ? 100 : image.Height;
				int width = image.Width * (height / image.Height);

				image.Mutate(x => x.Resize(width, height));

				var fileName = $"avatar_{userId}_{DateTime.UtcNow.ToString("yyyyMMddHHmmss")}.webp";
				string savePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

				await image.SaveAsWebpAsync(savePath, cancellationToken);

				return fileName;
			}
		}

		public async Task<string> UploadServerPicture(IFormFile file, Guid serverId, CancellationToken cancellationToken)
		{
			using (var image = await Image.LoadAsync(file.OpenReadStream()))
			{
				image.Metadata.ExifProfile = null;
				image.Metadata.IptcProfile = null;
				image.Metadata.XmpProfile = null;

				int height = image.Height > 100 ? 100 : image.Height;
				int width = image.Width * (height / image.Height);

				image.Mutate(x => x.Resize(width, height));

				var fileName = $"server_{serverId}_{DateTime.UtcNow.ToString("yyyyMMddHHmmss")}.webp";
				string savePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

				await image.SaveAsWebpAsync(savePath, cancellationToken);

				return fileName;
			}
		}

		public async Task<string> GenerateAndUploadPreviewImage(IFormFile file, CancellationToken cancellationToken)
		{
			using (var image = await Image.LoadAsync(file.OpenReadStream(), cancellationToken))
			{
				image.Metadata.ExifProfile = null;
				image.Metadata.IptcProfile = null;
				image.Metadata.XmpProfile = null;

				int width = image.Width > 550 ? 550 : image.Width;
				int height = image.Height * (width / image.Width);

				image.Mutate(x => x.Resize(width, height));

				var fileName = $"preview_{Guid.NewGuid().ToString("n")}.webp";
				string savePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

				await image.SaveAsWebpAsync(savePath, cancellationToken);

				return fileName;
			}
		}

		public async Task<byte[]?> GetByNameAsync(string fileName, CancellationToken cancellationToken)
		{
			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);
			if (!File.Exists(filePath))
				return null;

			return await File.ReadAllBytesAsync(filePath, cancellationToken);
		}
	}
}
