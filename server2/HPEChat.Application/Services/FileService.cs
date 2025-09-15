using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace HPEChat.Application.Services
{
	public class FileService
	{
		private readonly IConfiguration _configuration;
		private readonly string _uploadPath;
		private const string SectionName = "FileDirectory";

		public FileService(IConfiguration configuration)
		{
			_configuration = configuration;
			_uploadPath = _configuration.GetSection(SectionName)?.Value ?? throw new InvalidOperationException($"Configuration section '{SectionName}' is missing or null.");
		}

		public async Task<string> UploadFile(IFormFile file)
		{
			string randomString = Guid.NewGuid().ToString("n").Substring(0, 8);
			var fileName = $"{randomString}_{Path.GetFileName(file.FileName)}";
			var filePath = Path.Combine(_uploadPath, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

			return fileName;
		}

		public bool DeleteFile(string fileName)
		{
			try
			{
				string filePath = Path.Combine(_uploadPath, fileName);

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

		public async Task<string> UploadAvatar(IFormFile file, Guid userId)
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
				string savePath = Path.Combine(_uploadPath, fileName);

				await image.SaveAsWebpAsync(savePath);

				return fileName;
			}
		}

		public async Task<string> UploadServerPicture(IFormFile file, Guid serverId)
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
				string savePath = Path.Combine(_uploadPath, fileName);

				await image.SaveAsWebpAsync(savePath);

				return fileName;
			}
		}

		public async Task<string> GenerateAndUploadPreviewImage(IFormFile file)
		{
			using (var image = await Image.LoadAsync(file.OpenReadStream()))
			{
				image.Metadata.ExifProfile = null;
				image.Metadata.IptcProfile = null;
				image.Metadata.XmpProfile = null;

				int width = image.Width > 550 ? 550 : image.Width;
				int height = image.Height * (width / image.Width);

				image.Mutate(x => x.Resize(width, height));

				var fileName = $"preview_{Guid.NewGuid().ToString("n")}.webp";
				string savePath = Path.Combine(_uploadPath, fileName);

				await image.SaveAsWebpAsync(savePath);

				return fileName;
			}
		}
	}
}
