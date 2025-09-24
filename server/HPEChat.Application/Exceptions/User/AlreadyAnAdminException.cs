using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.User
{
	public class AlreadyAnAdminException(string name)
		: ValidationException($"User '{name}' is already an admin.", "ALREADY_AN_ADMIN")
	{
	}
}
