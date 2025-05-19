import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, Send, SmileIcon } from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import { z } from "zod"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const sendMessageSchema = z.object({
    message: z
        .string()
        .min(1, 'Musisz wpisać wiadomość')
        .max(2000, 'Maksymalnie 2000 znaków'),
});

interface MessageInputProps {
  onMessageSend: () => void;
}

type SendMessageValues = z.infer<typeof sendMessageSchema>;

export default function MessageInput({ onMessageSend }: MessageInputProps) {
  const selectedChannel = useAppStore((state) => state.selectedChannel);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { isSubmitting, isValid }
  } = useForm<SendMessageValues>({
    resolver: zodResolver(sendMessageSchema),
    mode: 'onChange',
  });

  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submitHandler = async (data: SendMessageValues) => {
    try {
      const newMessage = await sendMessage(
        selectedChannel!.id,
        data.message.trim(),
      )

      if (newMessage) {
        onMessageSend()
        reset()
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px"
        }
      }
    } catch (err) {
      console.error("API error sending message:", err)
    }
  };

  // auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "40px"
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = scrollHeight + "px"
    }
  }, [message])

return (
    <div className='border rounded-lg bg-background relative'>
        <form onSubmit={handleSubmit(submitHandler)} className='flex flex-col'>
            <div className='relative'>
                <Button
                    type='button'
                    size='icon'
                    variant='outline'
                    className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 z-10'>
                    <PlusIcon className='h-5 w-5' />
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
                    autoComplete='off'
                    autoCorrect='off'
                    autoCapitalize='none'
                    placeholder={`Napisz na #${selectedChannel?.name || ""}`}
                    className='min-h-[40px] max-h-[200px] resize-none pl-14 pr-24 py-2.5 border-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (isValid) {
                                handleSubmit(submitHandler)();
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
                        } ? "text-muted-foreground bg-transparent hover:bg-transparent" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
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