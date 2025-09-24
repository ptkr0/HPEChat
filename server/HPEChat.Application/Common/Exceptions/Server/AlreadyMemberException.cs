using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	public class AlreadyMemberException()
		: ValidationException("User is already a member of the server.", "ALREADY_MEMBER")
	{
	}
}
