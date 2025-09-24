
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HPEChat.Application.Attachments.GetPreview
{
	public class GetPreviewQuery : IRequest<byte[]>
	{
		public Guid UserId { get; set; }
		public string FileName { get; set; } = string.Empty;
	}
}
