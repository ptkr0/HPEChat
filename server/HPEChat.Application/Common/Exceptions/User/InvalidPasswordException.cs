using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.User
{
	public class InvalidPasswordException()
		: ValidationException("Password is not valid.", "INVALID_PASSWORD")
	{
	}
}
