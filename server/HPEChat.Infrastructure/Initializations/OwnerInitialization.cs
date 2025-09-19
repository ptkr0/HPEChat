using HPEChat.Domain.Entities;
using HPEChat.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HPEChat.Infrastructure.Initializations
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
		}
	}
}
