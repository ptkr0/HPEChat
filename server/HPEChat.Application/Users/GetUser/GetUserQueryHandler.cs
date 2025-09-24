using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;

namespace HPEChat.Application.Users.GetUser
{
	internal class GetUserQueryHandler : IRequestHandler<GetUserQuery, UserInfoDto>
	{
		private readonly IUserRepository _userRepository;
		public GetUserQueryHandler(IUserRepository userRepository)
		{
			_userRepository = userRepository;
		}
		public async Task<UserInfoDto> Handle(GetUserQuery request, CancellationToken cancellationToken)
		{
			var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

			if (user == null)
			{
				throw new ApplicationException("User not found");
			}

			var userDto = new UserInfoDto
			{
				Id = user.Id,
				Username = user.Username,
				Image = user.Image,
				Role = user.Role
			};

			return userDto;
		}
	}
}
