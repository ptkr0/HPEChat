using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Attachments.GetUserImage
{
	public class GetUserImageQuery : IRequest<byte[]>
	{
		public Guid UserId { get; set; }
	}
}
