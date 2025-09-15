using System.Security.Claims;

namespace HPEChat.Infrastructure.Extensions
{
	public static class ClaimExtension
	{
		public static string? GetEmail(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
		}

		public static Guid? GetUserId(this ClaimsPrincipal user)
		{
			string? userId = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

			return Guid.TryParse(userId, out Guid id) ? id : null;
		}

		public static string? GetRole(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
		}

		public static string? GetUsername(this ClaimsPrincipal user)
		{
			return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName)?.Value;
		}
	}
}
