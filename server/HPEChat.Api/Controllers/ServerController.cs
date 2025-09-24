using HPEChat.Application.Extensions;
using HPEChat.Application.Servers.CreateServer;
using HPEChat.Application.Servers.DeleteServer;
using HPEChat.Application.Servers.Dtos;
using HPEChat.Application.Servers.GetServer;
using HPEChat.Application.Servers.GetServers;
using HPEChat.Application.Servers.JoinServer;
using HPEChat.Application.Servers.LeaveServer;
using HPEChat.Application.Servers.UpdateServer;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HPEChat.Api.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerController : ControllerBase
	{
		private readonly IMediator _mediator;
		public ServerController(IMediator mediator)
		{
			_mediator = mediator;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerDto>> CreateServer([FromForm] CreateServerDto createServerDto, CancellationToken cancellationToken)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new CreateServerCommand
			{
				UserId = userId.Value,
				Name = createServerDto.Name,
				Description = createServerDto.Description,
				Image = createServerDto.Image
			};

			var result = await _mediator.Send(command, cancellationToken);

			return Ok(result);
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> UpdateServer(Guid id, [FromForm] CreateServerDto updateServerDto, bool deleteImage = false)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new UpdateServerCommand
			{
				ServerId = id,
				OwnerId = userId.Value,
				Name = updateServerDto.Name,
				Description = updateServerDto.Description,
				Image = updateServerDto.Image,
				DeleteImage = deleteImage
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<List<ServerDto>>> GetServers()
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var query = new GetServersQuery
			{
				UserId = userId.Value
			};

			var result = await _mediator.Send(query);

			return Ok(result);
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> GetServer(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var query = new GetServerQuery
			{
				UserId = userId.Value,
				ServerId = id
			};

			var result = await _mediator.Send(query);

			return Ok(result);
		}

		[HttpPost("join/{name}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> JoinServer(string name)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new JoinServerCommand
			{
				UserId = userId.Value,
				Name = name
			};

			var result = await _mediator.Send(command);

			return Ok(result);
		}

		[HttpDelete("leave/{serverId}")]
		[Authorize]
		public async Task<ActionResult> LeaveServer(Guid serverId)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new LeaveServerCommand
			{
				ServerId = serverId,
				UserId = userId.Value
			};

			await _mediator.Send(command);

			return Ok(new { message = "Left server successfully" });
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteServer(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var command = new DeleteServerCommand
			{
				ServerId = id,
				OwnerId = userId.Value,
			};

			await _mediator.Send(command);

			return Ok(new { message = "Server deleted successfully" });
		}

		[HttpDelete("kick/{serverId}/{userId}")]
		[Authorize]
		public async Task<ActionResult> KickUser(Guid serverId, Guid userId)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var ownerId = User.GetUserId();
			if (ownerId == null) return BadRequest("User not found");

			var command = new LeaveServerCommand
			{
				ServerId = serverId,
				UserId = userId,
			};

			await _mediator.Send(command);

			return Ok(new { message = "User kicked successfully" });
		}
	}
}
