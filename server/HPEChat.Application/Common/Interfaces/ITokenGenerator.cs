using HPEChat.Domain.Entities;

namespace HPEChat.Application.Common.Interfaces
{
	public interface ITokenGenerator
	{
		string GenerateToken(User user);
	}
}
