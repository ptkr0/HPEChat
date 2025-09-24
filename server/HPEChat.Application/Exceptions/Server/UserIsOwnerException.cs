using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.Server
{
	internal class UserIsOwnerException()
		: ValidationException("User is the owner of the server.", "USER_IS_OWNER")
	{
	}
}
