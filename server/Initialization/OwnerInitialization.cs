using HPEChat_Server.Data;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Initialization
{
	public class OwnerInitialization
	{
		public static async Task InitializeAdminAccount(IServiceProvider serviceProvider)
		{
			using var scope = serviceProvider.CreateScope();

			var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();

			if (await dbContext.Users.AnyAsync(u => u.Username == "admin"))
			{
				Console.WriteLine("Admin account already exists.");
				return;
			}

			User admin = new();

			admin.Username = "admin";
			admin.PasswordHash = new PasswordHasher<User>().HashPassword(admin, "admin");
			admin.Role = "Owner";

			await dbContext.Users.AddAsync(admin);
			await dbContext.SaveChangesAsync();

			Console.WriteLine("Admin account created with username: admin and password: admin");
		}
	}
}
