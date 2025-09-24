namespace HPEChat.Application.Common.Exceptions
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
