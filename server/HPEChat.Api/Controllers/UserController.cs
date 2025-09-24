using HPEChat.Application.Common.Extensions;
using HPEChat.Application.Users.ChangeImage;
using HPEChat.Application.Users.ChangePassword;
using HPEChat.Application.Users.ChangeUsername;
using HPEChat.Application.Users.Dtos;
using HPEChat.Application.Users.GetUser;
using HPEChat.Application.Users.GrantAdmin;
using HPEChat.Application.Users.LoginUser;
using HPEChat.Application.Users.RegisterUser;
using HPEChat.Application.Users.RevokeAdmin;
using HPEChat.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class UserController : ControllerBase
	{
		private readonly IMediator _mediator;
		public UserController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpPost("register")]
		public async Task<ActionResult<UserInfoDto>> Register([FromForm] UserDto registerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var command = new RegisterUserCommand
			{
				Username = registerDto.Username,
				Password = registerDto.Password,
				Image = registerDto.Image,
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpPost("login")]
		public async Task<ActionResult<UserInfoDto>> Login([FromBody] UserDto loginDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var command = new LoginUserCommand
			{
				Username = loginDto.Username,
				Password = loginDto.Password,
			};

			var result = await _mediator.Send(command);

			Response.Cookies.Append("Ciasteczko", result.Token, new CookieOptions
			{
				HttpOnly = true,
				SameSite = SameSiteMode.None,
				Secure = true,
				Path = "/",
			});

			return new UserInfoDto
			{
				Id = result.Id,
				Username = result.Username,
				Role = result.Role,
				Image = result.Image,
			};
		}

		[HttpPut("grant-admin/{id}")]
		[Authorize(Roles = "Owner")]
		public async Task<ActionResult<User>> GrantAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new GrantAdminCommand
			{
				UserId = id,
				OwnerId = userId.Value
			};

			await _mediator.Send(command);

			return Ok(new { message = "Admin granted successfully" });
		}

		[HttpPut("revoke-admin/{id}")]
		[Authorize(Roles = "Owner")]
		public async Task<ActionResult<User>> RevokeAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new RevokeAdminCommand
			{
				UserId = id,
				OwnerId = userId.Value
			};

			await _mediator.Send(command);

			return Ok(new { message = "Admin revoked successfully" });
		}

		[HttpPut("password")]
		[Authorize]
		public async Task<ActionResult<object>> ChangePassword([FromBody] ChangePasswordDto passwordDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new ChangePasswordCommand
			{
				UserId = userId.Value,
				CurrentPassword = passwordDto.OldPassword,
				NewPassword = passwordDto.NewPassword
			};

			await _mediator.Send(command);

			return Ok(new { message = "Password changed successfully" });
		}

		[HttpPut("username")]
		[Authorize]
		public async Task<ActionResult<object>> ChangeUsername([FromBody][MaxLength(50)] string username)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new ChangeUsernameCommand
			{
				UserId = userId.Value,
				NewUsername = username
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpPut("avatar")]
		[Authorize]
		public async Task<ActionResult<UserInfoDto>> ChangeAvatar(IFormFile? avatar = null)
		{
			// validate avatar file
			if (avatar != null && !FileExtension.IsValidAvatar(avatar))
				return BadRequest("Invalid file type or file size");

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new ChangeImageCommand
			{
				UserId = userId.Value,
				Image = avatar
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpPost("logout")]
		public IActionResult Logout()
		{
			Response.Cookies.Delete("Ciasteczko", new CookieOptions
			{
				HttpOnly = true,
				SameSite = SameSiteMode.None,
				Secure = true
			});

			return Ok(new { message = "You log out!" });
		}

		[HttpGet("auth-test")]
		[Authorize]
		public IActionResult AuthTest()
		{
			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var query = new GetUserQuery
			{
				UserId = userId.Value
			};

			var result = _mediator.Send(query).Result;

			return Ok(result);
		}

		[HttpGet("admin-test")]
		[Authorize(Roles = "Admin")]
		public IActionResult AdminTest()
		{
			return Ok(new { message = "You are authorized as admin!" });
		}
	}
}
