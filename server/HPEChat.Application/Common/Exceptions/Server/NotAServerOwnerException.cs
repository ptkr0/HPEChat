using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	public class NotAServerOwnerException()
		: ValidationException("User is not the owner of the server.", "NOT_OWNER")
	{
	}
}
