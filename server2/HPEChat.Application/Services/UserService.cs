using HPEChat.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HPEChat_Server.Services
{
	public class UserService
	{
		private readonly IConfiguration _configuration;

		public UserService(IConfiguration configuration)
		{
			_configuration = configuration;
		}

		public string CreateToken(User user)
		{
			var claims = new List<Claim>
				{
					new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
				};

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetValue<string>("JWT:SigningKey")!));

			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: _configuration.GetValue<string>("JWT:Issuer"),
				audience: _configuration.GetValue<string>("JWT:Audience"),
				expires: DateTime.Now.AddDays(7),
				claims: claims,
				signingCredentials: creds);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}
	}
}
