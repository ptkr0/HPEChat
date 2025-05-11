import MessageInput from "@/components/channel/message-input";

export default function ChannelLayout() {
  return (
    <div className="mx-auto p-2 flex flex-col w-full h-full">
        <div className="rounded-lg bg-sidebar flex-1 flex items-center justify-center text-muted-foreground overflow-auto">
            Tu będą wiadomości kanału
        </div>
        <div className="mt-4">
            <MessageInput />
        </div>
    </div>
  )
}