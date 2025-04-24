using HPEChat_Server.Dtos.Channel;
using HPEChat_Server.Dtos.User;

namespace HPEChat_Server.Dtos.Server
{
	public class ServerDto
	{
		public string Id { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string Description { get; set; } = string.Empty;
		public string OwnerId { get; set; } = string.Empty;
		public List<UserInfoDto> Members { get; set; } = new List<UserInfoDto>();
		public List<ChannelDto> Channels { get; set; } = new List<ChannelDto>();
	}
}
