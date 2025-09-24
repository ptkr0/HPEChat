using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.User
{
	public class InvalidUserImageException()
		: ValidationException("User image is not valid.", "INVALID_USER_IMAGE")
	{
	}
}
