using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace HPEChat_Server.Services
{
	public class FileService
	{
		private readonly string _uploadPath;
		public FileService(IConfiguration configuration)
		{
			_uploadPath = configuration.GetValue<string>("FileDirectory") ?? throw new InvalidOperationException("FileDirectory is not configured in the application settings.");
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

			return filePath;
		}

		public void DeleteFile(string fileName)
		{
			string filePath = Path.Combine(_uploadPath, fileName);

			if (File.Exists(filePath))
			{
				File.Delete(filePath);
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
