using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions.Server
{
	public class InvalidServerImageException()
		: ValidationException("Invalid image file type or size.", "INVALID_SERVER_IMAGE")
	{
	}
}
