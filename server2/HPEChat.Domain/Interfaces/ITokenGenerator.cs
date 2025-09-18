using HPEChat.Domain.Entities;

namespace HPEChat.Domain.Interfaces
{
	public interface ITokenGenerator
	{
		string GenerateToken(User user);
	}
}
