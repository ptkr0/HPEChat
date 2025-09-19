using HPEChat.Domain.Entities;

namespace HPEChat.Application.Interfaces
{
	public interface ITokenGenerator
	{
		string GenerateToken(User user);
	}
}
