using HPEChat.Application.Channels.Dtos;
using HPEChat.Application.Users.Dtos;

namespace HPEChat.Application.Servers.Dtos
{
	public class ServerDto
	{
		public Guid Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public string Description { get; set; } = string.Empty;
		public Guid OwnerId { get; set; }
		public string Image { get; set; } = string.Empty;
		public List<UserInfoDto> Members { get; set; } = new List<UserInfoDto>();
		public List<ChannelDto> Channels { get; set; } = new List<ChannelDto>();
	}
}
