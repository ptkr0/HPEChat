using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.Server
{
	public class AlreadyMemberException()
		: ValidationException("User is already a member of the server.", "ALREADY_MEMBER")
	{
	}
}
