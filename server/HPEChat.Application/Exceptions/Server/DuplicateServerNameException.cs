using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.Server
{
	public class DuplicateServerNameException(string name) 
		: ValidationException($"A server with the name '{name}' already exists.", "DUPLICATE_SERVER_NAME")
	{
	}
}
