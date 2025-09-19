using HPEChat.Application.Users.Dtos;
using HPEChat.Domain.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.GetUsers
{
	internal class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, ICollection<UserInfoDto>>
	{
		private readonly IUserRepository _userRepository;
		public GetUsersQueryHandler(IUserRepository userRepository)
		{
			_userRepository = userRepository;
		}
		public async Task<ICollection<UserInfoDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
		{
			var users = await _userRepository.GetAllAsync(cancellationToken);

			var usersDto = users.Select(user => new UserInfoDto
			{
				Id = user.Id,
				Username = user.Username,
				Image = user.Image,
				Role = user.Role
			}).ToList();

			return usersDto;
		}
	}
}
