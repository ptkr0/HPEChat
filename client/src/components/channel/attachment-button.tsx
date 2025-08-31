import { Attachment } from "@/types/attachment.types"
import { Video, Music, File, FileText } from "lucide-react"
import { Button } from "../ui/button"
import { fileService } from "@/services/fileService"
import type { AttachmentType } from "@/types/attachment.types"

interface AttachmentButtonProps {
  attachment: Attachment
}

export function AttachmentButton({ attachment }: AttachmentButtonProps) {
  const iconMap: Record<AttachmentType, React.ElementType> = {
    Video: Video,
    Audio: Music,
    Document: FileText,
    Image: File,
    Other: File,
  }
  const colorMap: Record<AttachmentType, string> = {
    Video: "text-purple-500",
    Audio: "text-green-500",
    Document: "text-blue-500",
    Image: "text-pink-500",
    Other: "text-gray-500",
  }
  const nameMap: Record<AttachmentType, string> = {
    Video: "Plik Wideo",
    Audio: "Plik Muzyczny",
    Document: "Dokument",
    Image: "Obraz",
    Other: "Załącznik",
  }
  const downloadTextMap: Record<AttachmentType, string> = {
    Video: "Pobierz Wideo",
    Audio: "Pobierz Muzykę",
    Document: "Pobierz Dokument",
    Image: "Pobierz Obraz",
    Other: "Pobierz Załącznik",
  }

  const Icon = iconMap[attachment.type] || File
  const color = colorMap[attachment.type] || "text-gray-500"
  const name = attachment.name || nameMap[attachment.type] || "Załącznik"
  const downloadText = downloadTextMap[attachment.type] || "Pobierz Załącznik"

  
  const downloadAttachment = async (attachment: Attachment) => {
    if (!attachment.fileName) return;
  
    try {
      const blob = await fileService.getServerAttachment(attachment.fileName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  return (
    <Button
      variant="ghost"
      className="flex items-center gap-2 p-3 h-auto transition-colors duration-200 hover:bg-accent/50 rounded-lg border border-border"
      onClick={() => downloadAttachment(attachment)}
    >
      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className={`size-6 ${color}`} />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">{attachment.name || name}</span>
        <span className="text-[10px] text-muted-foreground">{Math.ceil(attachment.size / 1000)} KB</span>
        <span className="text-xs text-muted-foreground">{downloadText}</span>
      </div>
    </Button>
  )
}