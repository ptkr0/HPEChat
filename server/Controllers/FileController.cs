using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class FileController : ControllerBase
	{
		private readonly string _uploadPath;

		public FileController(IConfiguration configuration)
		{
			_uploadPath = configuration.GetValue<string>("FileDirectory") ?? 
				throw new InvalidOperationException("FileDirectory is not configured in the application settings.");
		}

		[HttpGet("avatars/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetAvatar(string fileName)
		{
			if (string.IsNullOrWhiteSpace(fileName))
				return BadRequest("File name cannot be empty.");

			if (!fileName.StartsWith("avatar_") || !fileName.EndsWith(".webp") || fileName.Contains("..")) 
				return BadRequest("Invalid file name format or attempt to access restricted path.");

			var filePath = Path.Combine(_uploadPath, fileName);

			if (!System.IO.File.Exists(filePath))
				return NotFound("Avatar not found.");

			var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(fileBytes, "image/webp");
		}
	}
}
