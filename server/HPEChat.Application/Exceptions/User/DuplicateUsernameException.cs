using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.User
{
	public class DuplicateUsernameException(string name)
		: ValidationException($"Username '{name}' is already taken.", "DUPLICATE_USERNAME")
	{
	}
}
