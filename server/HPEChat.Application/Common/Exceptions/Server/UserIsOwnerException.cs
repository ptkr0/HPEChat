using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	internal class UserIsOwnerException()
		: ValidationException("User is owner of the server.", "USER_IS_OWNER")
	{
	}
}
