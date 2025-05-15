import { MessageBubble } from "@/components/channel/message-bubble";
import { MessageBubbleSkeleton } from "@/components/channel/message-bubble-skeleton";
import MessageInput from "@/components/channel/message-input";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import AuthContext from "@/context/AuthProvider";
import { useAppStore } from "@/stores/appStore";
import { useContext } from "react";

export default function ChannelLayout() {
  const { user, loading } = useContext(AuthContext); 
  const selectedServer = useAppStore((state) => state.selectedServer);
  const selectedChannel = useAppStore((state) => state.selectedChannel);
  const serverMessagesLoading = useAppStore((state) => state.channelMessagesLoading);
  const serverMessages = useAppStore((state) => state.selectedChannelMessages);

  // sort server messages by datetimeoffset
  const sortedMessages = serverMessages?.sort((a, b) => {
    if (a.sentAt < b.sentAt) return -1;
    if (a.sentAt > b.sentAt) return 1;
    return 0;
  });


  return (
    <div className="mx-auto p-2 flex flex-col w-full h-full overflow-hidden">
      <header className="flex h-8 shrink-0 items-center gap-2 px-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>HPEChat</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>{selectedServer?.name}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedChannel?.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="rounded-lg flex-1 overflow-auto">
          {serverMessagesLoading || !selectedServer || loading ? (
            <div className="flex-1 overflow-y-auto p-2">
              {[...Array(6)].map((_, i) => (
                <MessageBubbleSkeleton key={i} isCurrentUser={i % 2 === 0} />
              ))}
            </div>
          ) : serverMessages && serverMessages.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-2">
              {sortedMessages.map((message) => (
                <MessageBubble key={message.id} message={message} isSenderCurrentUser={user.id.toUpperCase() === message.senderId} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">Brak wiadomości w tym kanale.<br>
              </br>Przywitaj się 👋</p>
            </div>
          )}
        </div>
        <div className="mt-auto pt-2 sticky bottom-0">
          <MessageInput />
        </div>
      </div>
    </div>
  )
}