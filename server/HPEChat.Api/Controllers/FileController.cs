using HPEChat.Application.Attachments.GetPreview;
using HPEChat.Application.Attachments.GetServerImage;
using HPEChat.Application.Attachments.GetUserImage;
using HPEChat.Application.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class FileController : ControllerBase
	{
		private readonly IMediator _mediator;
		public FileController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpGet("avatars/{userId}")]
		[Authorize]
		public async Task<IActionResult> GetAvatar(Guid userId)
		{
			var query = new GetUserImageQuery { UserId = userId };

			var result = await _mediator.Send(query);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(result, "image/webp");
		}

		[HttpGet("serverImages/{id}")]
		[Authorize]
		public async Task<IActionResult> GetServerImage(Guid id)
		{
			var userId = User.GetUserId();
			if (userId == null)
				return BadRequest("User not found");

			var query = new GetServerImageQuery
			{
				UserId = userId.Value,
				ServerId = id
			};

			var result = await _mediator.Send(query);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(result, "image/webp");
		}

		[HttpGet("serverPreviews/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetPreview(string fileName)
		{
			var userId = User.GetUserId();
			if (userId == null)
				return BadRequest("User not found");

			var query = new GetPreviewQuery
			{
				UserId = userId.Value,
				FileName = fileName
			};

			var result = await _mediator.Send(query);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(result, "image/webp");
		}

		[HttpGet("serverAttachments/{fileName}")]
		[Authorize]
		public async Task<IActionResult> GetAttachment(string fileName)
		{
			var userId = User.GetUserId();
			if (userId == null)
				return BadRequest("User not found");

			var query = new GetPreviewQuery
			{
				UserId = userId.Value,
				FileName = fileName
			};

			var result = await _mediator.Send(query);

			Response.Headers.Append("Cache-Control", "private, max-age=86400");
			return File(result, "application/octet-stream");
		}
	}
}
