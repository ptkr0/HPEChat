using SixLabors.ImageSharp;
using System.Text;

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
			string randomString = Guid.NewGuid().ToString("n").Substring(0, 6);
			var fileName = $"{randomString}_{Path.GetFileName(file.FileName)}";
			var filePath = Path.Combine(_uploadPath, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

			return filePath;
		}

		public async Task<string> UploadAvatar(IFormFile file, Guid userId)
		{
			using (var image = await Image.LoadAsync(file.OpenReadStream()))
			{
				image.Metadata.ExifProfile = null;
				image.Metadata.IptcProfile = null;
				image.Metadata.XmpProfile = null;

				var fileName = $"avatar_{userId}.webp";
				string savePath = Path.Combine(_uploadPath, fileName);

				await image.SaveAsWebpAsync(savePath);

				return fileName;
			}
		}
	}
}
