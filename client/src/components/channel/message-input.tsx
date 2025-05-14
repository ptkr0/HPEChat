import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PlaneIcon as PaperPlaneIcon, PlusIcon, SmileIcon } from "lucide-react"

export default function MessageInput() {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log("Message sent:", message)
      setMessage("")
    }
  }

  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "40px"
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = scrollHeight + "px"
    }
  }, [message])

return (
    <div className="border rounded-lg bg-background relative">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 z-10"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="sr-only">Add attachment</span>
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message #general"
            className="min-h-[40px] max-h-[200px] resize-none pl-14 pr-24 py-2.5 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (message.trim()) {
                  console.log("Message sent:", message)
                  setMessage("")
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "40px"
                  }
                }
              }
            }}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            <Button type="button" size="icon" variant="ghost" className="rounded-full h-8 w-8">
              <SmileIcon className="h-5 w-5" />
              <span className="sr-only">Add emoji</span>
            </Button>

            <Button
              type="submit"
              size="icon"
              className={`rounded-full h-8 w-8 ${!message.trim() ? "text-muted-foreground bg-transparent hover:bg-transparent" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
              disabled={!message.trim()}
            >
              <PaperPlaneIcon className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}