using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Users.RevokeAdmin
{
	public class RevokeAdminCommand : IRequest
	{
		public Guid UserId { get; set; }
		public Guid OwnerId { get; set; }
	}
}
