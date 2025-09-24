using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.User
{
	public class InvalidPasswordException()
		: ValidationException("Password is not valid.", "INVALID_PASSWORD")
	{
	}
}
