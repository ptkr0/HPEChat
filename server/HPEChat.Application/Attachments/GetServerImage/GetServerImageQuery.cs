using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Attachments.GetServerImage
{
	public class GetServerImageQuery : IRequest<byte[]>
	{
		public Guid UserId { get; set; }
		public Guid ServerId { get; set; }
	}
}
