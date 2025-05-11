import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PlaneIcon as PaperPlaneIcon, PlusIcon, SmileIcon } from "lucide-react"

export default function MessageInput() {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log("Message sent:", message)
      setMessage("")
    }
  }

  return (
    <div className="border rounded-lg p-2 bg-background">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Button type="button" size="icon" variant="outline" className="rounded-full h-8 w-8 flex-shrink-0">
            <PlusIcon className="h-5 w-5" />
            <span className="sr-only">Dodaj załącznik</span>
          </Button>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Napisz na..."
            className="min-h-[40px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (message.trim()) {
                  console.log("Message sent:", message)
                  setMessage("")
                }
              }
            }}
          />

          <Button type="button" size="icon" variant="outline" className="rounded-full h-8 w-8 flex-shrink-0">
            <SmileIcon className="h-5 w-5" />
            <span className="sr-only">Dodaj emoji</span>
          </Button>

          <Button
            type="submit"
            size="icon"
            variant="default"
            className={`rounded-full h-8 w-8 flex-shrink-0 ${!message.trim() ? 'bg-accent text-accent-foreground' : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
            disabled={!message.trim()}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            <span className="sr-only">Wyślij wiadomość</span>
          </Button>
        </div>
      </form>
    </div>
  )
}