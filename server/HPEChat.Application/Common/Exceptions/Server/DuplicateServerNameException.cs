using HPEChat.Application.Common.Exceptions;

namespace HPEChat.Application.Common.Exceptions.Server
{
	public class DuplicateServerNameException(string name)
		: ValidationException($"A server with the name '{name}' already exists.", "DUPLICATE_SERVER_NAME")
	{
	}
}
