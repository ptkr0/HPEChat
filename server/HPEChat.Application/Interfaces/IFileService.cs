using Microsoft.AspNetCore.Http;

namespace HPEChat.Application.Interfaces
{
	public interface IFileService
	{
		Task<string> UploadFile(IFormFile file, CancellationToken cancellationToken);
		bool DeleteFile(string fileName);
		Task<string> UploadAvatar(IFormFile file, Guid userId, CancellationToken cancellationToken);
		Task<string> UploadServerPicture(IFormFile file, Guid serverId, CancellationToken cancellationToken);
		Task<string> GenerateAndUploadPreviewImage(IFormFile file, CancellationToken cancellationToken);
		Task<byte[]?> GetByNameAsync(string fileName, CancellationToken cancellationToken);
	}
}
