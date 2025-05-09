import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/stores/appStore";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { Loader2, MoreHorizontal, Plus, Settings, Trash } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Skeleton } from "../ui/skeleton";
import { useContext, useState } from "react";
import AuthContext from "@/context/AuthProvider";
import { CreateChannelModal } from "../modals/create-channel-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { ConfirmationDialog } from "../modals/confirmation-modal";

export function ServerSidebar() {
    const {
    selectedServerId,
    selectedServer,
    selectedChannelId,
    channels,
    serverDetailsLoading,
    } = useAppStore();
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const[showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const[showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
    const[selectedChannelOptionsId, setSelectedChannelOptionsId] = useState<string>('');

    const handleChannelClick = (channelId: string) => {
    navigate(`/servers/${selectedServerId}/${channelId}`);
    };

  return (
      <Sidebar className="left-auto text-accent-foreground w-56 border-r" collapsible="none">

          <SidebarHeader>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton size="lg">
                        {!serverDetailsLoading && selectedServer ? (
                            <>
                                <Avatar className="size-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                    <AvatarImage alt={selectedServer!.name} />
                                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-medium w-full h-full">
                                        {selectedServer!.name[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{selectedServer!.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{selectedServer!.description}</span>
                                </div> 
                            </>
                        ) : ( 
                            <Skeleton className="h-full w-full rounded-lg mb-2 flex items-center justify-center">
                                    <Loader2 className="animate-spin" />
                            </Skeleton>
                        )}
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
              <SidebarGroup>
                  <SidebarGroupLabel>Kanały</SidebarGroupLabel>
                  {selectedServer?.owner !== user.id && selectedServer ?
                  <SidebarGroupAction onClick={() => setShowCreateChannelModal(true)}>
                      <Plus />
                  </SidebarGroupAction>
                  : null}

                  <SidebarGroupContent>
                      <SidebarMenu>
                          {channels.map((channel) => (
                              <SidebarMenuItem key={channel.id}>
                                <SidebarMenuButton
                                    onClick={() => handleChannelClick(channel.id)}
                                    className={clsx(
                                        "text-left flex-1 mr-2",
                                        channel.id === selectedChannelId && "bg-accent"
                                    )}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <div className="text-lg flex-shrink-0 mr-1">#</div>
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                </SidebarMenuButton>
                                  {selectedServer?.owner !== user.id && selectedServer ?
                                   <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction>
                                            <MoreHorizontal />
                                        </SidebarMenuAction>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent side="right" align="start">
                                            <DropdownMenuItem onClick={() => [setSelectedChannelOptionsId(channel.id), setShowDeleteChannelModal(true)]}>
                                                <Settings/><span>Edytuj kanał</span>
                                            </DropdownMenuItem>
                                            <Separator className="my-1"></Separator>
                                            <DropdownMenuItem onClick={() => [setSelectedChannelOptionsId(channel.id), setShowDeleteChannelModal(true)]}>
                                                <Trash/><span>Usuń kanał</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    : null}
                              </SidebarMenuItem>
                          ))}
                      </SidebarMenu>
                  </SidebarGroupContent>
              </SidebarGroup>
          </SidebarContent>

            <CreateChannelModal
                isOpen={showCreateChannelModal}
                onClose={() => setShowCreateChannelModal(false)}
            />

            <ConfirmationDialog
                channelId={selectedChannelOptionsId}
                isOpen={showDeleteChannelModal}
                onClose={() => setShowDeleteChannelModal(false)}
            />
      </Sidebar>
  );
}
