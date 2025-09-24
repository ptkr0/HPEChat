using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.GrantAdmin
{
	public class GrantAdminCommand : IRequest
	{
		public Guid UserId { get; set; }
		public Guid OwnerId { get; set; }
	}
}
