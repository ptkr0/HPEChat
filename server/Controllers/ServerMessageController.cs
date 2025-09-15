using HPEChat_Server.Data;
using HPEChat_Server.Dtos.ServerMessage;
using HPEChat_Server.Dtos.User;
using HPEChat_Server.Extensions;
using HPEChat_Server.Hubs;
using HPEChat_Server.Models;
using HPEChat_Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HPEChat_Server.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ServerMessageController : ControllerBase
	{
		private readonly ApplicationDBContext _context;
		private readonly IHubContext<ServerHub, IServerClient> _hub;
		private readonly FileService _fileService;
		private readonly ILogger<ServerMessageController> _logger;
		public ServerMessageController(
			ApplicationDBContext context, 
			IHubContext<ServerHub, IServerClient> hub, 
			FileService fileService,
			ILogger<ServerMessageController> logger)
		{
			_context = context;
			_hub = hub;
			_fileService = fileService;
			_logger = logger;
		}

		[HttpGet]
		[Authorize]
		public async Task<ActionResult<ICollection<ServerMessageDto>>> GetMessages([FromQuery] GetServerMessagesDto getMessages)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");


			int pageSize = 50;

			var query = _context.ServerMessages
				.Where(m =>
					m.ChannelId == getMessages.ChannelId && // only messages from the specified channel  
					m.Channel.Server.Members.Any(mem => mem.Id == userId)); // only messages from channels the user is a member of  

			if (getMessages.LastCreatedAt.HasValue) query = query.Where(m => m.SentAt < getMessages.LastCreatedAt.Value); // only messages sent before the last loaded message  

			var messages = await query
				.AsNoTracking()
				.OrderByDescending(m => m.SentAt)
				.ThenByDescending(m => m.Id)
				.Select(m => new ServerMessageDto
				{
					Id = m.Id.ToString().ToUpper(),
					ChannelId = m.ChannelId.ToString().ToUpper(),
					Message = m.Message ?? string.Empty,
					SentAt = m.SentAt,
					IsEdited = m.IsEdited,
					Sender = new UserInfoDto
					{
						Id = m.SenderId.HasValue ? m.SenderId.Value.ToString().ToUpper() : string.Empty,
						Username = m.Sender != null ? m.Sender.Username : string.Empty,
						Image = m.Sender!.Image ?? string.Empty,
					},
					Attachment = m.Attachment != null ? new AttachmentDto
					{
						Id = m.Attachment.Id.ToString().ToUpper(),
						Name = m.Attachment.Name,
						Type = m.Attachment.ContentType.ToString(),
						Size = m.Attachment.Size,
						Width = m.Attachment.Width,
						Height = m.Attachment.Height,
						FileName = m.Attachment.StoredFileName,
						PreviewName = m.Attachment.PreviewName ?? string.Empty
					} : null
				})
				.Take(pageSize)
				.ToListAsync();

			return Ok(messages);
		}

		[HttpPost]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> SendMessageAttachment([FromForm] SendServerMessageWithAttachmentDto messageDto)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			// user can send message without attachment or attachment without message
			// but message and attachment cannot both be null or empty
			if (string.IsNullOrWhiteSpace(messageDto.Message) && messageDto.Attachment == null)
				return BadRequest("Message and attachment cannot both be null or empty.");

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var channel = await _context.Channels
				.Include(c => c.Server)
				.ThenInclude(c => c.Members)
				.FirstOrDefaultAsync(c => c.Id == messageDto.ChannelId && c.Server.Members.Any(m => m.Id == userId));

			if (channel == null) return NotFound("Channel not found or you are not a member of the server");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{				
				string? uploadedFilePath = null;
				string? uploadedPreviewPath = null;

				try
				{
					var message = new ServerMessage
					{
						ChannelId = messageDto.ChannelId,
						SenderId = userId,
						Message = messageDto.Message,
						SentAt = DateTimeOffset.UtcNow,
						IsEdited = false,
					};

					Attachment? attachment = null;
					if (messageDto.Attachment != null)
					{
						var attachmentType = FileExtension.CheckFile(messageDto.Attachment);
						if (attachmentType.HasValue)
						{
							long size = messageDto.Attachment.Length;

							uploadedFilePath = await _fileService.UploadFile(messageDto.Attachment);
							if (uploadedFilePath == null) throw new Exception("Failed to upload attachment.");

							int? width = null, height = null;
							string? previewPath = null;

							if (attachmentType == AttachmentType.Image)
							{
								(width, height) = FileExtension.GetImageDimensions(messageDto.Attachment);

								// preview images are smaller and they will load when user scrolls messages
								// if user clicks on an image original will load
								uploadedPreviewPath = await _fileService.GenerateAndUploadPreviewImage(messageDto.Attachment);
								uploadedPreviewPath ??= uploadedFilePath;
								previewPath = uploadedPreviewPath;
							}
							else if (attachmentType == AttachmentType.Video)
							{
								// no ffmpeg support in this version
								//(width, height) = await FileExtension.GetVideoDimensions(filePath);
							}

							attachment = new Attachment
							{
								Name = messageDto.Attachment.FileName,
								StoredFileName = uploadedFilePath,
								ContentType = attachmentType.Value,
								Size = size,
								Width = width,
								Height = height,
								PreviewName = previewPath,
								UploadedAt = DateTimeOffset.UtcNow
							};

							await _context.Attachments.AddAsync(attachment);
							await _context.SaveChangesAsync();
						}
						else
						{
							return BadRequest("Invalid attachment type.");
						}
					}

					message.Attachment = attachment;
					await _context.ServerMessages.AddAsync(message);
					await _context.SaveChangesAsync();

					var messageDtoResponse = new ServerMessageDto
					{
						Id = message.Id.ToString().ToUpper(),
						ChannelId = message.ChannelId.ToString().ToUpper(),
						Message = message.Message ?? string.Empty,
						SentAt = message.SentAt,
						IsEdited = message.IsEdited,
						Sender = new UserInfoDto
						{
							Id = message.SenderId.HasValue ? message.SenderId.Value.ToString().ToUpper() : string.Empty,
							Username = message.Sender?.Username ?? string.Empty,
						},
						Attachment = attachment != null ? new AttachmentDto
						{
							Id = attachment.Id.ToString().ToUpper(),
							Name = attachment.Name,
							Type = attachment.ContentType.ToString(),
							Size = attachment.Size,
							Width = attachment.Width,
							Height = attachment.Height,
							FileName = attachment.StoredFileName,
							PreviewName = attachment.PreviewName ?? string.Empty
						} : null
					};

					await _hub
						.Clients
						.Group(ServerHub.GroupName(channel.ServerId))
						.MessageAdded(channel.ServerId, messageDtoResponse);

					await transaction.CommitAsync();

					return Ok(messageDtoResponse);
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();

					// clean up any uploaded files if transaction failed
					if (uploadedFilePath != null)
					{
						_fileService.DeleteFile(uploadedFilePath);
					}
					if (uploadedPreviewPath != null && uploadedPreviewPath != uploadedFilePath)
					{
						_fileService.DeleteFile(uploadedPreviewPath);
					}

					_logger.LogError(ex, "Error sending message in channel {ChannelId} by user {UserId}", messageDto.ChannelId, userId);

					return StatusCode(500, $"Error sending message: {ex.Message}");
				}
			}
		}

		[HttpPatch("{id}")]
		[Authorize]
		public async Task<ActionResult<ServerMessageDto>> EditMessage(Guid id, [FromBody][MaxLength(2000)] string message)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			var serverMessage = await _context.ServerMessages
				.Include(u => u.Sender)
				.Include(s => s.Channel.Server)
				.FirstOrDefaultAsync(m =>
					m.Id == id && // check if message exists
					m.SenderId == userId && // check if the user is the sender
					m.Channel.Server.Members.Any(u => u.Id == userId)); // check if the user is still a member of the server

			if (serverMessage == null) return NotFound("Message not found or you are not the sender");

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					serverMessage.Message = message;
					serverMessage.IsEdited = true;
					await _context.SaveChangesAsync();

					await _hub
							.Clients
							.Group(ServerHub.GroupName(serverMessage.Channel.ServerId))
							.MessageEdited(serverMessage.Channel.ServerId, new ServerMessageDto
							{
								Id = serverMessage.Id.ToString().ToUpper(),
								ChannelId = serverMessage.ChannelId.ToString().ToUpper(),
								Message = serverMessage.Message,
								SentAt = serverMessage.SentAt,
								IsEdited = serverMessage.IsEdited,
								Sender = new UserInfoDto
								{
									Id = serverMessage.SenderId.HasValue ? serverMessage.SenderId.Value.ToString().ToUpper() : string.Empty,
									Username = serverMessage.Sender != null ? serverMessage.Sender.Username : string.Empty,
									Image = serverMessage.Sender?.Image ?? string.Empty,
								},
							});

					await transaction.CommitAsync();

					return Ok(new ServerMessageDto
					{
						Id = serverMessage.Id.ToString().ToUpper(),
						ChannelId = serverMessage.ChannelId.ToString().ToUpper(),
						Message = serverMessage.Message,
						SentAt = serverMessage.SentAt,
						IsEdited = serverMessage.IsEdited,
						Sender = new UserInfoDto
						{
							Id = serverMessage.SenderId.HasValue ? serverMessage.SenderId.Value.ToString().ToUpper() : string.Empty,
							Username = serverMessage.Sender != null ? serverMessage.Sender.Username : string.Empty,
							Image = serverMessage.Sender?.Image ?? string.Empty,
						},
					});
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();
					return StatusCode(500, $"Error editing message: {ex.Message}");
				}
			}
		}

		[HttpDelete("{id}")]
		[Authorize]
		public async Task<ActionResult> DeleteMessage(Guid id)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);

			var userId = User.GetUserId();
			if (userId == null) return BadRequest("User not found");

			ServerMessage? serverMessage = await _context.ServerMessages
				.Include(u => u.Sender)
				.Include(s => s.Channel.Server)
				.Include(a => a.Attachment) // include attachment if it exists
				.FirstOrDefaultAsync(m =>
					m.Id == id && // check if message exists
					m.SenderId == userId && // check if the user is the sender
					m.Channel.Server.Members.Any(u => u.Id == userId)); // check if the user is still a member of the server
			if (serverMessage == null) return NotFound("Message not found or you are not the sender");

			Guid serverId = serverMessage.Channel.ServerId;
			Guid channelId = serverMessage.ChannelId;

			await using (var transaction = await _context.Database.BeginTransactionAsync())
			{
				try
				{
					var filesToDelete = new List<string>();
					if (serverMessage.Attachment != null)
					{
						filesToDelete.Add(serverMessage.Attachment.StoredFileName);
						if (serverMessage.Attachment.PreviewName != null && serverMessage.Attachment.PreviewName != serverMessage.Attachment.StoredFileName)
						{
							filesToDelete.Add(serverMessage.Attachment.PreviewName);
						}
					}

					_context.ServerMessages.Remove(serverMessage);

					await _context.SaveChangesAsync();

					await _hub
						.Clients
						.Group(ServerHub.GroupName(serverId))
						.MessageRemoved(serverId, channelId, id);

					await transaction.CommitAsync();

					foreach (var file in filesToDelete)
					{
						_fileService.DeleteFile(file);
					}

					return Ok(new { message = "Message deleted successfully" });
				}
				catch (Exception ex)
				{
					await transaction.RollbackAsync();

					_logger.LogError(ex, "Error deleting message {MessageId} in server {ServerId} by user {UserId}", id, serverId, userId);
					return StatusCode(500, $"Error deleting message: {ex.Message}");
				}
			}
		}
	}
}
