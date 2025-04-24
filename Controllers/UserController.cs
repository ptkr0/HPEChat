using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
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

		[HttpPatch("grant-admin/{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<User>> GrantAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			if(!userService.CheckIfRoot(userId)) return Unauthorized("You are not head admin");

			var user = await userService.GetUserByIdAsync(id.ToString());
			if (user == null) return BadRequest("User not found");
			if (user.Role == "Admin") return BadRequest("User is already admin");

			user.Role = "Admin";

			var result = await userService.UpdateUserAsync(user);
			if (result == null) return BadRequest("Error updating user privileges");

			return Ok(new
			{
				user.Id,
				user.Username,
				user.Role,
			});
		}

		[HttpPatch("revoke-admin/{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<User>> RevokeAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			if (!userService.CheckIfRoot(userId)) return Unauthorized("You are not head admin");

			var user = await userService.GetUserByIdAsync(id.ToString());
			if (user == null) return BadRequest("User not found");
			if (user.Role != "Admin") return BadRequest("User is not admin");

			user.Role = "User";

			var result = await userService.UpdateUserAsync(user);
			if (result == null) return BadRequest("Error updating user privileges");

			return Ok(new
			{
				user.Id,
				user.Username,
				user.Role,
			});
		}

		[HttpPatch]
		[Authorize]
		public async Task<ActionResult<User>> ChangePassword([FromBody] ChangePasswordDto passwordDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var user = await userService.GetUserByIdAsync(userId);
			if (user == null) return BadRequest("User not found");

			var result = await userService.ChangePasswordAsync(user, passwordDto);
			if (!result) return BadRequest("Error updating user");

			return Ok(new { message = "Password changed"});
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

			return Ok(new { message = "You log out!" });
		}

		[HttpGet("auth-test")]
		[Authorize]
		public IActionResult AuthTest()
		{
			var userId = User.GetUserId();
			var username = User.GetUsername();
			var role = User.GetRole();
			return Ok(new UserInfoDto { Id = userId!, Username = username!, Role = role! });
		}

		[HttpGet("admin-test")]
		[Authorize(Roles = "Admin")]
		public IActionResult AdminTest()
		{
			return Ok(new { message = "You are authorized as admin!" });
		}
	}
}
