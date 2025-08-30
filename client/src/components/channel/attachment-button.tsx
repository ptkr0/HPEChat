import { Attachment } from "@/types/attachment.types"
import { Video, Music, File, FileText } from "lucide-react"
import { Button } from "../ui/button"
import { fileService } from "@/services/fileService"

interface AttachmentButtonProps {
  type: "video" | "music" | "document" | "other"
  attachment: Attachment
}

export function AttachmentButton({ type, attachment }: AttachmentButtonProps) {
  const iconMap = {
    video: Video,
    music: Music,
    document: FileText,
    other: File,
  }
  const colorMap = {
    video: "text-purple-500",
    music: "text-green-500",
    document: "text-blue-500",
    other: "text-gray-500",
  }
  const nameMap = {
    video: "Plik Wideo",
    music: "Plik Muzyczny",
    document: "Dokument",
    other: "Załącznik",
  }
  const downloadTextMap = {
    video: "Pobierz Wideo",
    music: "Pobierz Muzykę",
    document: "Pobierz Dokument",
    other: "Pobierz Załącznik",
  }

  const Icon = iconMap[type]
  const color = colorMap[type]
  const name = attachment.name || nameMap[type]
  const downloadText = downloadTextMap[type]

  
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