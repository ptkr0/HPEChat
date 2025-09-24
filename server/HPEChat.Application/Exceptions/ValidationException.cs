using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Exceptions
{
	public abstract class ValidationException : Exception
	{
		public string ErrorCode { get; }

		protected ValidationException(string message, string errorCode) : base(message)
		{
			ErrorCode = errorCode;
		}
	}
}
