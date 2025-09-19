using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using HPEChat.Domain.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HPEChat.Application.Interfaces;

namespace HPEChat.Infrastructure.Services
{
	public class TokenGenerator : ITokenGenerator
	{
		private readonly JwtSettings _jwtSettings;

		public TokenGenerator(JwtSettings jwtSettings)
		{
			_jwtSettings = jwtSettings;
		}

		public string GenerateToken(User user)
		{
			var claims = new List<Claim>
				{
					new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SigningKey));

			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: _jwtSettings.Issuer,
				audience: _jwtSettings.Audience,
				expires: DateTime.Now.AddDays(7),
				claims: claims,
				signingCredentials: creds);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
