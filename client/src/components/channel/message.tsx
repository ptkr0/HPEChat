import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ServerMessage } from "@/types/server-message.type"
import { format } from "date-fns"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { Edit2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Textarea } from "../ui/textarea"
import { useAppStore } from "@/stores/appStore"

interface MessageProps {
  message: ServerMessage,
  isSenderCurrentUser: boolean
}

export function Message({ message, isSenderCurrentUser }: MessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.message)
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteMessage = useAppStore((state) => state.deleteMessage)
  const editMessage = useAppStore((state) => state.editMessage)

  const handleDelete = () => {
    setIsDeleting(true)
    deleteMessage(message.id)
      .then(() => {
      })
      .catch((error) => {
        console.error("Error deleting message:", error)
      })
      .finally(() => {
        setIsDeleting(false)
      })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    editMessage(message.id, editedMessage)
      .then(() => {
        setEditedMessage(editedMessage)
      })
      .catch((error) => {
        console.error("Error editing message:", error)
      })
      .finally(() => {
        setIsEditing(false)
      })
  }

  const handleCancel = () => {
    setEditedMessage(message.message)
    setIsEditing(false)
  }

  return (
    <div
      className="flex w-full gap-3 mb-3 px-4 py-1.5 hover:bg-accent/50 hover:rounded-lg relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-10 w-10 mt-0.5 flex-shrink-0">
        <AvatarImage
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
          alt={message.senderName}
        />
        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col max-w-full overflow-hidden w-full">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm hover:underline cursor-pointer">{message.senderName}</span>
          <span className="text-xs text-muted-foreground">{format(message.sentAt, "dd-MM-yyyy hh:mm")}</span>
        </div>

        {isEditing ? (
          <div className="mt-1 w-full">
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="min-h-[80px] w-full"
              autoFocus
            />
            <div className="flex gap-2 mt-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-foreground mt-0.5">
            <div className="break-words overflow-hidden whitespace-pre-wrap">{message.message}</div>
          </div>
        )}
      </div>

      {/* Action buttons that appear on hover */}
      <div
        className={cn(
          "absolute top-1.5 right-2 flex gap-1 transition-opacity duration-200",
          isHovered && isSenderCurrentUser ? "opacity-100" : "opacity-0",
        )}
      >
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit}>
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit message</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete message</span>
        </Button>
      </div>
    </div>
  )
}