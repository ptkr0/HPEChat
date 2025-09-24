using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.User
{
	public class NotAnAdminException(string name)
		: ValidationException($"User '{name}' is not an admin.", "NOT_AN_ADMIN")
	{
	}
}
