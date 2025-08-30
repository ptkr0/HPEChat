import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { File, FileText, Music, PlusIcon, Send, SmileIcon, X } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import { z } from "zod"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serverMessageService } from "@/services/serverMessageService"

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

const sendMessageSchema = z.object({
  message: z
    .string()
    .max(2000, "Maksymalnie 2000 znaków")
    .optional()
    .transform((val) => val ?? ""), // undefined to empty string
  attachment: z
    .custom<File | undefined>()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
      message: "Maksymalny rozmiar pliku to 500MB",
    })
    .optional(),
})
  // message can be empty only if attachment is provided
  .refine(
    (data) => {
      const isMessageEmpty = data.message.trim() === "";
      const hasAttachment = !!data.attachment;
      return !isMessageEmpty || hasAttachment;
    },
    {
      message: "Musisz wpisać wiadomość lub dodać załącznik",
      path: ["message"],
    }
  );

interface MessageInputProps {
  onInputChange: (height: number) => void;
  onMessageSend: () => void;
}

type SendMessageValues = z.infer<typeof sendMessageSchema>;

export default function MessageInput({ onMessageSend, onInputChange }: MessageInputProps) {
  const selectedChannel = useAppStore((state) => state.selectedChannel);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isValid }
  } = useForm({
    resolver: zodResolver(sendMessageSchema),
    mode: 'onChange',
  });
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFileSelect = (file: File) => {

    // revoke previous URL and create new one
    if (filePreview) {
      URL.revokeObjectURL(filePreview)
    }
    const objectUrl = URL.createObjectURL(file)
    setValue("attachment", file, { shouldValidate: true })
    setFilePreview(objectUrl)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
      calculateComponentHeight()
    }
  }
  const removeFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview)
    }
    setFilePreview(null)
    setValue("attachment", undefined, { shouldValidate: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const submitHandler = async (data: SendMessageValues) => {
    try {
      const newMessage = await serverMessageService.send(
        selectedChannel!.id,
        data.message.trim(),
        data.attachment
      )

      if (newMessage) {
        onMessageSend()
        removeFile()
        reset()
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px"
        }
      }
    } catch (err) {
      console.error("API error sending message:", err)
    }
  };

  const calculateComponentHeight = () => {
    if (ref.current) {
      const height = ref.current.clientHeight
      onInputChange(height)
    }
  }

  // auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "40px"
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = scrollHeight + "px"
    }
  }, [message])

  // clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
      }
    }
  }, [filePreview])

  return (
    <div ref={ref} className='border rounded-lg bg-background relative'>

      <form onSubmit={handleSubmit(submitHandler)} className='flex flex-col' onChange={calculateComponentHeight}>

        {filePreview && (
          <div className="flex items-center gap-3 p-3 border-b bg-muted/30 animate-in fade-in duration-200">
            {(() => {
              const file = fileInputRef.current?.files?.[0]
              if (!file) return null

              const fileType = file.type
              const isImage = fileType.startsWith("image/")
              const isVideo = fileType.startsWith("video/")
              const isAudio = fileType.startsWith("audio/")
              const isDocument = fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")

              if (isImage) {
                return (
                  <div className="relative group overflow-hidden rounded-md border border-muted">
                    <img
                      src={filePreview}
                      alt="File preview"
                      className="max-h-56 max-w-full object-contain rounded-md transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs text-white font-medium truncate">{file.name}</span>
                    </div>
                  </div>
                )              
              } else if (isVideo) {
                return (
                  <div className="relative group overflow-hidden rounded-md border border-muted">
                    <video 
                      className="max-h-56 max-w-full object-contain rounded-md transition-transform" 
                      controls
                      src={filePreview}
                    />
                  </div>
                )
              } else if (isAudio) {
                return (
                  <div className="flex items-center gap-3 p-3 bg-muted/80 rounded-md border border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Plik audio</p>
                    </div>
                  </div>
                )
              } else if (isDocument) {
                return (
                  <div className="flex items-center gap-3 p-3 bg-muted/80 rounded-md border border-border">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Dokument</p>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div className="flex items-center gap-3 p-3 bg-muted/80 rounded-md border border-border">
                    <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                      <File className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Plik</p>
                    </div>
                  </div>
                )
              }
            })()}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full absolute right-3 gap-1"
              onClick={removeFile}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Usuń załącznik</span>
            </Button>
          </div>
        )}


        <div className='relative'>
          <Button
            type='button'
            size='icon'
            variant='outline'
            className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 z-10'
            onClick={() => !isSubmitting && fileInputRef.current?.click()}>
            <PlusIcon className='h-5 w-5' />
            <input
              type='file'
              accept='image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt'
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className='hidden'
              onClick={(e) => (e.currentTarget.value = "")}
            />
            <span className='sr-only'>Dodaj załącznik</span>
          </Button>

          <Textarea
            {...register("message", {
              onChange: (e) => setMessage(e.target.value),
              value: message,
            })}
            ref={(e) => {
              register("message").ref(e);
              textareaRef.current = e;
            }}
            disabled={isSubmitting}
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='none'
            placeholder={`Napisz na #${selectedChannel?.name || ""}`}
            className='min-h-[44px] resize-none pl-14 pr-24 py-3 border-0 focus-visible:ring-0 overflow-hidden focus-visible:ring-offset-0'
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isValid) {
                  handleSubmit(submitHandler)(e);
                }
              }
            }}
          />

          <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10'>
            <Button
              type='button'
              size='icon'
              variant='outline'
              className='rounded-full h-8 w-8'>
              <SmileIcon className='h-5 w-5' />
              <span className='sr-only'>Prześlij emoji</span>
            </Button>

            <Button
              type='submit'
              size='icon'
              className={`rounded-full h-8 w-8 ${
                !isSubmitting && isValid
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "text-muted-foreground bg-transparent hover:bg-transparent"
              }`}              
              disabled={isSubmitting || !isValid}>
              <Send className='h-4 w-4' />
              <span className='sr-only'>Wyślij wiadomość</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}