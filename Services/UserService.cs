using HPEChat_Server.Data;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HPEChat_Server.Services
{
	public class UserService(ApplicationDBContext context, IConfiguration configuration)
	{
		public async Task<User?> GetUserByIdAsync(string id)
		{
			return await context.Users
				.FirstOrDefaultAsync(u => u.Id.ToString() == id);
		}

		public async Task<User?> RegisterAsync(UserDto register)
		{
			if (await context.Users.AnyAsync(u => u.Username.ToUpper() == register.Username.ToUpper())) return null;

			User user = new();

			var hashedPassword = new PasswordHasher<User>()
				.HashPassword(user, register.Password);

			user.Username = register.Username;
			user.PasswordHash = hashedPassword;
			user.Role = "User";

			await context.Users.AddAsync(user);
			await context.SaveChangesAsync();

			return user;
		}

		public async Task<ReturnLoginDto?> LoginAsync(UserDto login)
		{
			var user = await context.Users
				.FirstOrDefaultAsync(u => u.Username == login.Username);
			if (user == null) return null;

			var passwordVerificationResult = new PasswordHasher<User>()
				.VerifyHashedPassword(user, user.PasswordHash, login.Password);

			if (passwordVerificationResult == PasswordVerificationResult.Failed) return null;

			var token = CreateToken(user);
			if (token == null) return null;

			return new ReturnLoginDto
			{
				Id = user.Id,
				Username = user.Username,
				Token = token
			};
		}

		public async Task<bool> ChangePasswordAsync(User user, ChangePasswordDto passwordDto)
		{
			var passwordVerificationResult = new PasswordHasher<User>()
				.VerifyHashedPassword(user, user.PasswordHash, passwordDto.OldPassword);
			if (passwordVerificationResult == PasswordVerificationResult.Failed) return false;

			var hashedPassword = new PasswordHasher<User>()
				.HashPassword(user, passwordDto.NewPassword);

			user.PasswordHash = hashedPassword;
			context.Users.Update(user);
			await context.SaveChangesAsync();

			return true;
		}

		public bool CheckIfRoot(string userId)
		{
			return configuration.GetValue<string>("RootId") == userId;
		}

		public async Task<User?> UpdateUserAsync(User user)
		{
			try
			{
				context.Users.Update(user);
				await context.SaveChangesAsync();

				return user;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return null;
			}
		}

		public string CreateToken(User user)
		{
			var claims = new List<Claim>
			{
				new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new Claim(ClaimTypes.Name, user.Username),
				new Claim(ClaimTypes.Role, user.Role)
			};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.GetValue<string>("JWT:SigningKey")!));

			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: configuration.GetValue<string>("JWT:Issuer"),
				audience: configuration.GetValue<string>("JWT:Audience"),
				expires: DateTime.Now.AddDays(7),
				claims: claims,
				signingCredentials: creds);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
