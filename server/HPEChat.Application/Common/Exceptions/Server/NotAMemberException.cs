using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	public class NotAMemberException()
		: ValidationException("User is not a member of the server.", "NOT_MEMBER")
	{
	}
}
