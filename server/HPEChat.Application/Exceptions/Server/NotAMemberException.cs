using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.Server
{
	public class NotAMemberException()
		: ValidationException("User is not a member of the server.", "NOT_MEMBER")
	{
	}
}
