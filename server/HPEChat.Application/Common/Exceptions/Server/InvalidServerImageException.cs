using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	public class InvalidServerImageException()
		: ValidationException("Invalid server image file type or size.", "INVALID_SERVER_IMAGE")
	{
	}
}
