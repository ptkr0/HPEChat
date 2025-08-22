import { Message } from "@/components/channel/message";
import { MessageBubbleSkeleton } from "@/components/channel/message-skeleton";
import MessageInput from "@/components/channel/message-input";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import AuthContext from "@/context/AuthProvider";
import { useAppStore } from "@/stores/useAppStore";
import { useContext, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChannelLayout() {
  const { user, loading } = useContext(AuthContext);
  const selectedServer = useAppStore((state) => state.selectedServer);
  const selectedChannel = useAppStore((state) => state.selectedChannel);
  const serverMessagesLoading = useAppStore((state) => state.channelMessagesLoading);
  const serverMessages = useAppStore((state) => state.selectedChannelMessages);

  const [messageInputHeight, setMessageInputHeight] = useState(64);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);

  // sort server messages by datetimeoffset
  const sortedMessages = serverMessages?.sort((a, b) => {
    if (a.sentAt < b.sentAt) return -1;
    if (a.sentAt > b.sentAt) return 1;
    return 0;
  });

  // measure the message input height
  useEffect(() => {
    if (messageInputRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setMessageInputHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(messageInputRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const isNearBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');

      if (scrollContainer) {
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        return isAtBottom;
      }
    }
    return true;
  };

  const newMessage = () => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedChannel]);

  // also scroll to bottom when new messages arrive if user is already at bottom
  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [serverMessages?.length]);

  return (
    <div className="mx-auto p-2 flex flex-col w-full h-full">
      <header className="flex h-12 shrink-0 items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList >
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage className="font-semibold">HPEChat</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>
                  {selectedServer?.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{selectedChannel?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-col flex-1" style={{ height: `calc(100% - 3rem)` }}>

        <div className="flex-1 relative" style={{ height: `calc(100% - ${messageInputHeight}px - 1rem)` }}>
          {serverMessagesLoading || !selectedServer || loading ? (
            <div className="flex-1 overflow-y-auto p-2 w-full">
              {[...Array(6)].map((_, i) => (
                <MessageBubbleSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ScrollArea
              ref={scrollAreaRef}
              className="h-full pr-4"
              type="always"
            >
              <div className="p-2">
                {serverMessages && serverMessages.length > 0 ? (
                  sortedMessages.map((message, index) => {
                    // check if the previous message is from the same user and within 10 minutes
                    // if so, set isContinuation to true
                    const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
                    const isSameUser = prevMessage ? prevMessage.sender.id === message.sender.id : false;
                    const timeDifference = prevMessage
                      ? Math.abs(new Date(message.sentAt).getTime() - new Date(prevMessage.sentAt).getTime()) / 60000
                      : Infinity;
                    const isContinuation = isSameUser && timeDifference < 10;

                    return (
                      <Message
                        key={message.id}
                        message={message}
                        isSenderCurrentUser={user.id.toUpperCase() === message.sender.id}
                        isContinuation={isContinuation}
                      />
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-muted-foreground text-center">
                      Brak wiadomości na tym kanale.<br />
                      Przywitaj się 👋
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <div ref={messageInputRef} className="mt-2">
          <MessageInput onMessageSend={() => newMessage()} />
        </div>
      </div>
    </div>
  )
}