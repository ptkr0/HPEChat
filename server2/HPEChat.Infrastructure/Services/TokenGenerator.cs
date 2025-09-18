using HPEChat.Domain.Entities;
using HPEChat.Domain.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Infrastructure.Services
{
	internal class TokenGenerator : ITokenGenerator
	{
		public string GenerateToken(User user)
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
