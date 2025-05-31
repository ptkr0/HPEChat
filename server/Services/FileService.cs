namespace HPEChat_Server.Services
{
	public class FileService
	{
		public async Task<string> UploadFile(IFormFile file, string directory)
		{
			string randomString = Guid.NewGuid().ToString("n").Substring(0, 6);

			var fileName = Path.GetFileName(file.FileName);
			fileName = $"{randomString}_{fileName}";

			var filePath = Path.Combine(Directory.GetCurrentDirectory(), directory, fileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}

			return filePath;
		}
	}
}
