using HPEChat_Server.Data;
using HPEChat_Server.Dtos.Server;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		public ServerController(ApplicationDBContext context)
		{
			_context = context;
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerDto>> CreateServer([FromBody] CreateServerDto createServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var user = await _context.Users.FindAsync(Guid.Parse(userId));
			if (user == null) return BadRequest("User not found");

			var server = new Server
			{
				Name = createServerDto.Name,
				Description = createServerDto.Description,
				OwnerId = Guid.Parse(userId)
			};

			server.Members.Add(user);

			await _context.Servers.AddAsync(server);
			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> UpdateServer(string id, [FromBody] CreateServerDto updateServerDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var server = await _context.Servers.FindAsync(Guid.Parse(id));
			if (server == null) return NotFound("Server not found");
			if (server.OwnerId.ToString() != userId) return BadRequest("You are not the owner of this server");

			server.Name = updateServerDto.Name ?? server.Name;
			server.Description = updateServerDto.Description ?? server.Description;

			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<List<ServerDto>>> GetServers()
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var servers = await _context.Servers
				.Where(s => s.Members.Any(u => u.Id.ToString() == userId))
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString(),
				})
				.ToListAsync();

			return Ok(servers);
		}

		[HttpGet("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> GetServer(string id)
		{
			var server = await _context.Servers
				.Include(s => s.Members)
				.Select(s => new ServerDto
				{
					Id = s.Id.ToString(),
					Name = s.Name,
					Description = s.Description,
					OwnerId = s.OwnerId.ToString(),
					Members = s.Members.Select(m => new UserInfoDto
					{
						Id = m.Id.ToString(),
						Username = m.Username,
					}).ToList()
				})
				.FirstOrDefaultAsync(s => s.Id.ToString() == id);

			if (server == null) return NotFound("Server not found");

			return Ok(server);
		}

		[HttpPost("join/{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> JoinServer(string id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");
			
			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id.ToString() == id);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId.ToString() == userId) return BadRequest("You are already the owner of this server");

			var user = await _context.Users.FindAsync(Guid.Parse(userId));
			if (user == null) return BadRequest("User not found");

			if (server.Members.Any(m => m.Id == user.Id)) return BadRequest("You are already a member of this server");

			server.Members.Add(user);
			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}

		[HttpPost("leave/{id}")]
		[Authorize]
		public async Task<ActionResult<ServerDto>> LeaveServer(string id)
		{
			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var server = await _context.Servers
				.Include(s => s.Members)
				.FirstOrDefaultAsync(s => s.Id.ToString() == id);

			if (server == null) return NotFound("Server not found");
			if (server.OwnerId.ToString() == userId) return BadRequest("You are the owner of this server, you can't leave it");

			var user = await _context.Users.FindAsync(Guid.Parse(userId));
			if (user == null) return BadRequest("User not found");

			if (!server.Members.Any(m => m.Id == user.Id)) return BadRequest("You are not a member of this server");

			server.Members.Remove(user);
			await _context.SaveChangesAsync();

			return Ok(new ServerDto
			{
				Id = server.Id.ToString(),
				Name = server.Name,
				Description = server.Description,
				OwnerId = server.OwnerId.ToString()
			});
		}
	}
}
