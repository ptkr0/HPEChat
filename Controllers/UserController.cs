using HPEChat_Server.Dtos.User;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class UserController(UserService userService) : ControllerBase
	{
		[HttpPost("register")]
		public async Task<ActionResult<User>> Register([FromBody] UserDto registerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var user = await userService.RegisterAsync(registerDto);

			if (user == null) return BadRequest("User with that name already exists already exists");

			return Ok(new
			{
				user.Id,
				user.Username,
				user.Role,
			});
		}

		[HttpPost("login")]
		public async Task<ActionResult<ReturnLoginDto>> Login([FromBody] UserDto loginDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var user = await userService.LoginAsync(loginDto);
			if (user == null) return BadRequest("Invalid username or password");

			Response.Cookies.Append("Ciasteczko", user.Token, new CookieOptions
			{
				HttpOnly = true,
				SameSite = SameSiteMode.None,
				Secure = true,
				Path = "/",
			});

			return Ok(user);
		}

		[HttpPost("logout")]
		public IActionResult Logout()
		{
			Response.Cookies.Delete("Authorization", new CookieOptions
			{
				HttpOnly = true,
				SameSite = SameSiteMode.None,
				Secure = true
			});

			return Ok("You log out!");
		}

		[HttpGet("auth-test")]
		[Authorize]
		public IActionResult AuthTest()
		{
			return Ok("You are authorized!");
		}

		[HttpGet("admin-test")]
		[Authorize(Roles = "Admin")]
		public IActionResult AdminTest()
		{
			return Ok("You are authorized as admin!");
		}
	}
}
