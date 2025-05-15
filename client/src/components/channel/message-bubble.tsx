import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ServerMessage } from "@/types/server-message.type"
import { format } from "date-fns"

interface MessageBubbleProps {
  message: ServerMessage,
  isSenderCurrentUser: boolean
}

export function MessageBubble({ message, isSenderCurrentUser }: MessageBubbleProps) {

  return (
    <div className={cn("flex w-full max-w-[80%] gap-3 mb-4", isSenderCurrentUser ? "ml-auto flex-row-reverse" : "")}>
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} alt={message.senderName} />
        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col max-w-full">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-semibold text-sm", isSenderCurrentUser ? "text-right" : "")}>{message.senderName}</span>
          <span className="text-xs text-muted-foreground">{format(message.sentAt, "MMM d, yyyy h:mm a")}</span>
        </div>

        <div
          className={cn(
            "mt-1 rounded-lg p-3 text-sm",
            isSenderCurrentUser ? "bg-secondary text-secondary-foreground rounded-tr-none" : "bg-muted rounded-tl-none",
          )}
        >

          <div className="break-words overflow-hidden whitespace-pre-wrap">{message.message}</div>
        </div>
      </div>
    </div>
  )
}