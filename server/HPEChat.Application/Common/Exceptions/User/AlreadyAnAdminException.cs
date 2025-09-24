using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.User
{
	public class AlreadyAnAdminException(string name)
		: ValidationException($"User '{name}' is already an admin.", "ALREADY_AN_ADMIN")
	{
	}
}
