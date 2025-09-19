using HPEChat.Application.Extensions;
using HPEChat.Domain.Configuration;
using HPEChat.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class FileController : ControllerBase
	{
		private readonly FileStorageSettings _fileStorageSettings;
		private readonly ApplicationDBContext _context;

		public FileController(IOptions<FileStorageSettings> fileStorageSettings, ApplicationDBContext context)
		{
			_fileStorageSettings = fileStorageSettings.Value;
			_context = context;
		}

		[HttpGet("avatars/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetAvatar(string fileName)
		{
			if (string.IsNullOrWhiteSpace(fileName))
				return BadRequest("File name cannot be empty.");

			if (!fileName.StartsWith("avatar_") || !fileName.EndsWith(".webp") || fileName.Contains(".."))
				return BadRequest("Invalid file name format or attempt to access restricted path.");

			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

			if (!System.IO.File.Exists(filePath))
				return NotFound("Avatar not found.");

			var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(fileBytes, "image/webp");
		}

		[HttpGet("serverImages/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetServerImage(string fileName)
		{
			if (string.IsNullOrWhiteSpace(fileName))
				return BadRequest("File name cannot be empty.");

			if (!fileName.StartsWith("server_") || !fileName.EndsWith(".webp") || fileName.Contains(".."))
				return BadRequest("Invalid file name format or attempt to access restricted path.");

			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);
			if (!System.IO.File.Exists(filePath))
				return NotFound("Server image not found.");

			var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(fileBytes, "image/webp");
		}

		[HttpGet("serverPreviews/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetPreview(string fileName)
		{
			if (string.IsNullOrWhiteSpace(fileName))
				return BadRequest("File name cannot be empty.");

			if (!fileName.StartsWith("preview_") || !fileName.EndsWith(".webp") || fileName.Contains(".."))
				return BadRequest("Invalid file name format or attempt to access restricted path.");

			var userId = User.GetUserId();

			var exists = await _context.Attachments
				.AsNoTracking()
				.AnyAsync(a =>
					a.PreviewName == fileName &&
					a.ServerMessage!.Channel.Server.Members
					 .Any(m => m.Id == userId)
				);

			if (!exists)
				return Forbid("You are not a member of this server or preview does not exist.");

			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);

			if (!System.IO.File.Exists(filePath))
				return NotFound("Preview image not found.");

			var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(fileBytes, "image/webp");
		}

		[HttpGet("serverAttachments/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetAttachment(string fileName)
		{
			if (string.IsNullOrWhiteSpace(fileName))
				return BadRequest("File name cannot be empty.");

			if (fileName.Contains(".."))
				return BadRequest("Invalid file name format or attempt to access restricted path.");

			var userId = User.GetUserId();
			var exists = await _context.Attachments
				.AsNoTracking()
				.AnyAsync(a =>
					a.StoredFileName == fileName &&
					a.ServerMessage!.Channel.Server.Members
					 .Any(m => m.Id == userId)
				);

			if (!exists)
				return Forbid("You are not a member of this server or attachment does not exist.");

			var filePath = Path.Combine(_fileStorageSettings.FileDirectory, fileName);
			if (!System.IO.File.Exists(filePath))
				return NotFound("Attachment not found.");

			var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(fileBytes, "application/octet-stream");
		}
	}
}
