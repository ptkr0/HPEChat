import MessageInput from "@/components/channel/message-input";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useAppStore } from "@/stores/appStore";

export default function ChannelLayout() {
  const selectedServer = useAppStore((state) => state.selectedServer);
  const selectedChannel = useAppStore((state) => state.selectedChannel);


  return (
    <div className="mx-auto p-2 flex flex-col w-full h-full">
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
        <div className="rounded-lg bg-sidebar flex-1 flex items-center justify-center text-muted-foreground overflow-auto">
            Tu będą wiadomości kanału
        </div>
        <div className="mt-2">
            <MessageInput />
        </div>
    </div>
  )
}