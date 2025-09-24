﻿using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Servers.LeaveServer
{
	public class LeaveServerCommand : IRequest
	{
		public Guid ServerId { get; set; }
		public Guid UserId { get; set; }
	}
}
