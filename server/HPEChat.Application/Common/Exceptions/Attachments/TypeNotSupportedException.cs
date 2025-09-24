using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Attachments
{
	public class TypeNotSupportedException()
		: ValidationException("Attached file is not supported", "INVALID_ATTACHMENT")
	{
	}
}
