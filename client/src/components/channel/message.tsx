import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ServerMessage } from "@/types/server-message.type"
import { format } from "date-fns"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { Edit2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Textarea } from "../ui/textarea"
import { useAppStore } from "@/stores/appStore"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

const messageEditSchema = z.object({
  editedContent: z
    .string()
    .min(1, "Wiadomość nie może być pusta.")
    .max(2000, "Wiadomość jest za długa (maksymalnie 2000 znaków)."),
})

type MessageEditFormValues = z.infer<typeof messageEditSchema>

interface MessageProps {
  message: ServerMessage
  isContinuation: boolean // continuations are messages that are sent by the same user in a row. this approach mimics the behavior of Discord
  isSenderCurrentUser: boolean
}

export function Message({ message, isSenderCurrentUser, isContinuation }: MessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteMessage = useAppStore((state) => state.deleteMessage)
  const editMessage = useAppStore((state) => state.editMessage)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageEditFormValues>({
    resolver: zodResolver(messageEditSchema),
    defaultValues: {
      editedContent: message.message,
    },
  })

  const handleDelete = () => {
    setIsDeleting(true)
    deleteMessage(message.id)
      .catch((error) => {
        console.error("Error deleting message:", error)
      })
      .finally(() => {
        setIsDeleting(false)
      })
  }

  const handleEdit = () => {
    reset({ editedContent: message.message })
    setIsEditing(true)
  }

  const handleSaveSubmit = (data: MessageEditFormValues) => {
    return editMessage(message.id, data.editedContent)
      .catch((error) => {
        console.error("Error editing message:", error)
      })
      .finally(() => {
        setIsEditing(false)
      })
  }

  const handleCancel = () => {
    reset({ editedContent: message.message })
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 hover:bg-accent/50 hover:rounded-lg relative",
        isContinuation ? "py-0.5 mb-0.5 pl-[4.3rem]" : "py-1.5 mt-3",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* message time on hover for messages that are a continuation and don't have header */}
      {isContinuation && isHovered && (
        <div className="absolute left-5 text-[11px] text-muted-foreground" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          {format(new Date(message.sentAt), "HH:mm")}
        </div>
      )}

      {/* if message is not a continuation, show the header with sender name, avatar and send time */}
      {!isContinuation && (
        <Avatar className="size-10 mt-0.5 flex-shrink-0">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
            alt={message.senderName}
          />
          <AvatarFallback>{message.senderName[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-full overflow-hidden w-full", isContinuation && "mt-0")}>
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm hover:underline cursor-pointer">{message.senderName}</span>
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(message.sentAt), "dd.MM.yyyy HH:mm")}
            </span>
          </div>
        )}

        {/* section that shows when the message is being edited */}
        {isEditing ? (
          <form onSubmit={handleSubmit(handleSaveSubmit)} className={cn("w-full", isContinuation ? "mt-0" : "mt-1")}>
            <Controller
              name="editedContent"
              control={control}
              render={({ field }) => (
                <Textarea
                  id='editTextarea'
                  {...field}
                  className={cn(
                    "min-h-[80px] w-full",
                    errors.editedContent && "border-destructive focus-visible:ring-destructive",
                  )}
                  autoFocus
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(handleSaveSubmit)(e)
                    } else if (e.key === "Escape") {
                      handleCancel()
                    }
                  }}
                />
              )}
            />
            {errors.editedContent && <p className="text-sm text-destructive mt-1">{errors.editedContent.message}</p>}
            <div className="flex gap-2 mt-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} type="button" disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </form>
        ) : (
          <div className={cn("text-foreground", isContinuation ? "mt-0" : "mt-0.5")}>
            <span className="break-words overflow-hidden whitespace-pre-wrap">{message.message}</span>
            <span className="text-[10px] text-muted-foreground">{message.isEdited && "  (edytowano)"}</span>
          </div>
        )}
      </div>

      {/* action buttons that appear on hover */}
      <div
        className={cn(
          "absolute right-2 flex gap-1",
          isContinuation ? "top-0" : "top-1.5",
          isHovered && isSenderCurrentUser && !isEditing ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={handleEdit} 
          disabled={isEditing || isSubmitting}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edytuj wiadomość</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:text-red-400"
          onClick={handleDelete}
          disabled={isDeleting || isSubmitting}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Usuń wiadomość</span>
        </Button>
      </div>
    </div>
  )
}
