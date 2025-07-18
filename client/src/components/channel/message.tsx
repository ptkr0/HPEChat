import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ServerMessage } from "@/types/server-message.type"
import { format } from "date-fns"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { Edit2, FileText, Trash2, File, Music, Video } from 'lucide-react'
import { useEffect, useRef, useState } from "react"
import { Textarea } from "../ui/textarea"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { serverMessageService } from "@/services/serverMessageService"
import { useAppStore } from "@/stores/appStore"
import { ScrollArea } from "../ui/scroll-area"
import { Attachment, AttachmentType } from "@/types/attachment.types"
import { ImageAttachment } from "./image-attachment"
import { fileService } from "@/services/fileService"
import { useOnScreen } from "@/hooks/useOnScreen"

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

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref as React.RefObject<HTMLElement>, { rootMargin: "200px" });
  const avatarBlob = useAppStore((state) => state.avatarBlobs.get(message.sender.id));
  const fetchAndCacheAvatar = useAppStore((state) => state.fetchAndCacheAvatar);

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

  useEffect(() => {
    if (isVisible && message.sender.image) {
      fetchAndCacheAvatar(message.sender);
    }
  }, [isVisible, message.sender, fetchAndCacheAvatar]);

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await serverMessageService.delete(message.id);
    } catch(error) {
      console.error("Error deleting message:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    reset({ editedContent: message.message })
    setIsEditing(true)
  }

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

  const urlifyMessage = (message: string) => {
    if (!message) return "";

    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi
    return message.replace(
      urlRegex,
      (url) =>
        '<a target="_blank" class="text-purple-500 hover:underline break-all" href="' + url + '">' + url + "</a>",
    )
  }

  const handleSaveSubmit = async (data: MessageEditFormValues) => {
    await serverMessageService.edit(message.id, data.editedContent.trim())
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
        "group flex w-full gap-3 px-4 hover:bg-accent/50 hover:rounded-lg relative",
        isContinuation ? "py-0.5 mb-0.5 pl-[4.3rem]" : "py-1.5 mt-3",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* message time on hover for messages that are a continuation and don't have header */}
      {isContinuation && isHovered && (
        <div
          className="absolute left-5 text-[11px] text-muted-foreground"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          {format(new Date(message.sentAt), "HH:mm")}
        </div>
      )}

      {/* if message is not a continuation, show the header with sender name, avatar and send time */}
      {!isContinuation && (
        <Avatar className="size-10 mt-0.5 flex-shrink-0 border-2 border-transparent group-hover:border-primary/10 duration-200" ref={ref}>
          <AvatarImage
            src={avatarBlob}
            alt={message.sender.username}
          />
          <AvatarFallback>{message.sender.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-full overflow-hidden w-full", isContinuation && "mt-0")}>
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm hover:underline cursor-pointer">{message.sender.username}</span>
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
                <ScrollArea className="max-h-[200px]">
                <Textarea
                  id="editTextarea"
                  {...field}
                  className={cn(
                    "min-h-[80px] w-full overflow-hidden",
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
                </ScrollArea>
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
          <>
            {message.message && (
              <div className={cn("text-foreground relative pr-16", isContinuation ? "mt-0" : "mt-0.5")}>
                <div className="break-all overflow-hidden whitespace-pre-wrap">
                  <span dangerouslySetInnerHTML={{ __html: urlifyMessage(message.message) }} />
                  <span className="text-[10px] text-muted-foreground ml-2">{message.isEdited && "(edytowano)"}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* section that shows when the message has an attachment */}
        {message.attachment && (
          <div className="my-1">
            {message.attachment.type === AttachmentType.IMAGE && message.attachment.previewName ? (
                <ImageAttachment attachment={message.attachment} />
            ) : (null)}
            
            {message.attachment.type === AttachmentType.VIDEO && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-3 h-auto hover:bg-accent/50 rounded-lg border border-border"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{message.attachment.name || 'Plik Wideo'}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.ceil(message.attachment.size / 1000)} KB</span>
                  <span className="text-xs text-muted-foreground" onClick={() => downloadAttachment(message.attachment!)}>Kliknij aby odtworzyć</span>
                </div>
              </Button>
            )}
            
            {message.attachment.type === AttachmentType.AUDIO && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-3 h-auto hover:bg-accent/50 rounded-lg border border-border"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{message.attachment.name || 'Plik Audio'}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.ceil(message.attachment.size / 1000)} KB</span>
                  <span className="text-xs text-muted-foreground" onClick={() => downloadAttachment(message.attachment!)}>Kliknij aby posłuchać</span>
                </div>
              </Button>
            )}
            
            {message.attachment.type === AttachmentType.DOCUMENT && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-3 h-auto hover:bg-accent/50 rounded-lg border border-border"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{message.attachment.name || 'Dokument'}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.ceil(message.attachment.size / 1000)} KB</span>
                  <span className="text-xs text-muted-foreground" onClick={() => downloadAttachment(message.attachment!)}>Kliknij aby otworzyć</span>
                </div>
              </Button>
            )}
            
            {message.attachment.type === AttachmentType.OTHER && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-3 h-auto hover:bg-accent/50 rounded-lg border border-border"
              >
                <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <File className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{message.attachment.name || 'Plik'}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.ceil(message.attachment.size / 1000)} KB</span>
                  <span className="text-xs text-muted-foreground" onClick={() => downloadAttachment(message.attachment!)}>Kliknij aby pobrać</span>
                </div>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* action buttons that appear on hover */}
      <div
        className={cn(
          "absolute right-2 flex gap-1 z-10",
          isContinuation ? "top-0" : "top-1.5",
          isHovered && isSenderCurrentUser && !isEditing ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >

        {message.message && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 hover:text-blue-400 bg-accent/50"
            onClick={handleEdit}
            disabled={isEditing || isSubmitting}
          >
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edytuj wiadomość</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:text-red-400 bg-accent/50"
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