using HPEChat.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace HPEChat.Api.Middleware
{
	public class GlobalExceptionHandler : IExceptionHandler
	{
		private readonly ILogger _logger;
		public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
		{
			_logger = logger;
		}
		public async ValueTask<bool> TryHandleAsync(
			HttpContext httpContext, 
			Exception exception, 
			CancellationToken cancellationToken)
		{
			_logger.LogError(exception, "Exception occured: {Message}", exception.Message);

			var problemDetails = exception switch
			{
				ValidationException ex => new ProblemDetails
				{
					Status = (int)HttpStatusCode.BadRequest,
					Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1",
					Title = "A validation error occurred.",
					Detail = ex.Message,
					Extensions = { { "code", ex.ErrorCode } }
				},
				KeyNotFoundException ex => new ProblemDetails
				{
					Status = (int)HttpStatusCode.NotFound,
					Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4",
					Title = "The specified resource was not found.",
					Detail = ex.Message
				},
				UnauthorizedAccessException ex => new ProblemDetails
				{
					Status = (int)HttpStatusCode.Unauthorized,
					Type = "https://datatracker.ietf.org/doc/html/rfc7235#section-3.1",
					Title = "Unauthorized access.",
					Detail = ex.Message
				},
				_ => new ProblemDetails
				{
					Status = (int)HttpStatusCode.InternalServerError,
					Type = "https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1",
					Title = "An unexpected error occurred.",
					Detail = "We've encountered an issue and our team has been notified."
				}
			};

			httpContext.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

			await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

			return true;
		}

	}
}
