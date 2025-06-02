using HPEChat_Server.Data;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class UserController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		private readonly FileService _fileService;
		private readonly IConfiguration _configuration;
		private readonly UserService _userService;

		public UserController(ApplicationDBContext context, FileService fileService, IConfiguration configuration, UserService userService)
		{
			_context = context;
			_fileService = fileService;
			_configuration = configuration;
			_userService = userService;
		}

		[HttpPost("register")]
		public async Task<ActionResult<User>> Register([FromForm] UserDto registerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			if (await _context.Users.AnyAsync(u => u.Username.ToUpper() == registerDto.Username.ToUpper()))
				return BadRequest("Username is already taken");

			await using var transaction = await _context.Database.BeginTransactionAsync();
			try
			{
				User user = new()
				{
					Username = registerDto.Username,
					Role = "User"
				};

				user.PasswordHash = new PasswordHasher<User>().HashPassword(user, registerDto.Password);
				await _context.Users.AddAsync(user);
				await _context.SaveChangesAsync();

				if (registerDto.Image != null && FileExtension.IsValidAvatar(registerDto.Image))
				{
					var imagePath = await _fileService.UploadAvatar(registerDto.Image, user.Id);
					if (imagePath == null) throw new Exception("Failed to save avatar image.");

					user.Image = imagePath;
					_context.Users.Update(user);
					await _context.SaveChangesAsync();
				}

				await transaction.CommitAsync();
				return user;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				await transaction.RollbackAsync();
				return BadRequest("Error registering user: " + ex.Message);
			}
		}

		[HttpPost("login")]
		public async Task<ActionResult<ReturnLoginDto>> Login([FromBody] UserDto loginDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == loginDto.Username);
			if (user == null) return BadRequest("Invalid username or password");

			var passwordVerificationResult = new PasswordHasher<User>()
				.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);

			if (passwordVerificationResult == PasswordVerificationResult.Failed) return BadRequest("Invalid username or password");

			var token = _userService.CreateToken(user);
			if (token == null) return BadRequest("Error creating token. Try again later");

			Response.Cookies.Append("Ciasteczko", token, new CookieOptions
			{
				HttpOnly = true,
				SameSite = SameSiteMode.None,
				Secure = true,
				Path = "/",
			});

			return new ReturnLoginDto
			{
				Id = user.Id,
				Username = user.Username,
				Token = token,
				Role = user.Role,
				Image = user.Image ?? string.Empty
			};
		}

		[HttpPatch("grant-admin/{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<User>> GrantAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			if (string.Equals(_configuration.GetValue<string>("RootId"), userId.ToString())) return Unauthorized("You are not head admin");

			var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
			if (user == null) return BadRequest("User not found");
			if (user.Role == "Admin") return BadRequest("User is already admin");

			try
			{
				user.Role = "Admin";
				_context.Users.Update(user);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					Id = user.Id.ToString().ToUpper(),
					user.Username,
					user.Role,
				});
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return BadRequest("Error updating user privileges: " + ex.Message);
			}
		}

		[HttpPatch("revoke-admin/{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<User>> RevokeAdmin(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			if (string.Equals(_configuration.GetValue<string>("RootId"), userId.ToString())) return Unauthorized("You are not head admin");

			var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
			if (user == null) return BadRequest("User not found");
			if (user.Role == "Admin") return BadRequest("User is already admin");

			try
			{
				user.Role = "User";
				_context.Users.Update(user);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					Id = user.Id.ToString().ToUpper(),
					user.Username,
					user.Role,
				});
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return BadRequest("Error updating user privileges: " + ex.Message);
			}
		}

		[HttpPatch]
		[Authorize]
		public async Task<ActionResult<User>> ChangePassword([FromBody] ChangePasswordDto passwordDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
			if (user == null) return BadRequest("User not found");

			var passwordVerificationResult = new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, passwordDto.OldPassword);
			if (passwordVerificationResult == PasswordVerificationResult.Failed) return BadRequest("Invalid password");

			try
			{
				var hashedPassword = new PasswordHasher<User>().HashPassword(user, passwordDto.NewPassword);

				user.PasswordHash = hashedPassword;
				_context.Users.Update(user);
				await _context.SaveChangesAsync();

				return Ok(new { message = "Password changed" });
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return BadRequest("Error changing password: " + ex.Message);
			}
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
			Console.ForegroundColor = ConsoleColor.Yellow;
			Console.WriteLine("AuthTest called");
			Console.ResetColor();
			var userId = User.GetUserId();
			if (userId == null) return Unauthorized("User not found");

			var user = _context.Users.FirstOrDefault(u => u.Id == userId);
			if (user == null) return Unauthorized("User not found");

			return Ok(new UserInfoDto
			{
				Id = user.Id.ToString().ToUpper(),
				Username = user.Username,
				Role = user.Role,
				Image = user.Image ?? string.Empty
			});
		}

		[HttpGet("admin-test")]
		[Authorize(Roles = "Admin")]
		public IActionResult AdminTest()
		{
			return Ok(new { message = "You are authorized as admin!" });
		}
	}
}
