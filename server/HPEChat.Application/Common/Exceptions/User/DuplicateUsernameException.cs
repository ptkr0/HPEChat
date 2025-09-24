using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.User
{
	public class DuplicateUsernameException(string name)
		: ValidationException($"Username '{name}' is already taken.", "DUPLICATE_USERNAME")
	{
	}
}
