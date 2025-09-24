using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.User
{
	public class NotAnAdminException(string name)
		: ValidationException($"User '{name}' is not an admin.", "NOT_AN_ADMIN")
	{
	}
}
