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
import { useAppStore } from "@/stores/useAppStore";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { Hash, MoreHorizontal, Plus, Settings, Trash } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Skeleton } from "../ui/skeleton";
import { useContext, useState } from "react";
import AuthContext from "@/context/AuthProvider";
import { CreateChannelModal } from "../modals/channel-modals/create-channel-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { DeleteChannelDialog } from "../modals/channel-modals/delete-channel-dialog";
import { ServerInfoModal } from "../modals/server-modals/server-info-modal";
import { EditChannelModal } from "../modals/channel-modals/edit-channel-modal";
import { Channel } from "@/types/channel.types";

export function ServerSidebar() {
  const {
    selectedServer,
    selectedChannel,
    serverDetailsLoading,
  } = useAppStore();
  const navigate = useNavigate();

  const serverImageBlobs = useAppStore((state) => state.serverImageBlobs);
  const serverBlobImage = serverImageBlobs.get(selectedServer?.id || '');

  const { user, loading } = useContext(AuthContext);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [isServerDetailsOpen, setServerDetailsOpen] = useState(false);
  const [selectedChannelOptions, setSelectedChannelOptions] = useState<Channel | null>(null);

  const sortedChannels = selectedServer?.channels?.sort((a, b) => a.name.localeCompare(b.name)) || [];

  const handleChannelClick = (channelId: string) => {
    navigate(`/servers/${selectedServer?.id}/${channelId}`);
  };

  return (
    <Sidebar className="left-auto w-60 border-r" collapsible="none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton size="lg" onClick={() => setServerDetailsOpen(true)}>
            {!serverDetailsLoading && selectedServer?.id ? (
              <>
                <Avatar className="size-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  <AvatarImage 
                    src={serverBlobImage || undefined}
                    alt={selectedServer!.name} />
                  <AvatarFallback className="bg-muted flex items-center justify-center text-sm font-medium w-full h-full">
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
              </Skeleton>
            )}
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Kanały</SidebarGroupLabel>
          {loading || serverDetailsLoading ? (
            <SidebarGroupContent>
              <SidebarMenu>
                {[...Array(3)].map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-8 w-full rounded-md my-1" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          ) : (
            selectedServer && user && (
              (() => {
                return (
                  <>
                    {selectedServer.ownerId === user.id.toUpperCase() && (
                      <SidebarGroupAction onClick={() => setShowCreateChannelModal(true)}>
                        <Plus />
                      </SidebarGroupAction>
                    )}
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {selectedServer.channels && selectedServer.channels.length > 0 ? (
                          sortedChannels.map((channel) => (
                            <SidebarMenuItem key={channel.id}>
                              <SidebarMenuButton
                                onClick={() => handleChannelClick(channel.id)}
                                className={clsx(
                                "transition-all duration-200 hover:bg-accent/75",
                                {
                                  "bg-accent text-accent-foreground pointer-events-none":
                                  channel.id === selectedChannel?.id,
                                }
                                )}
                              >
                                <div className="flex items-center overflow-hidden">
                                  <Hash className="size-4 text-muted-foreground mr-1" />
                                  <span className="truncate">{channel.name}</span>
                                </div>
                              </SidebarMenuButton>
                              {selectedServer.ownerId === user.id.toUpperCase() && (
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <SidebarMenuAction>
                                      <MoreHorizontal />
                                    </SidebarMenuAction>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent side="right" align="start">
                                    <DropdownMenuItem onClick={() => [setSelectedChannelOptions(channel), setShowEditChannelModal(true)]}>
                                      <Settings /><span className="text-blue-400 focus:text-blue-400">Edytuj kanał</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => [setSelectedChannelOptions(channel), setShowDeleteChannelModal(true)]}>
                                      <Trash /><span className="text-red-500 focus:text-red-500">Usuń kanał</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </SidebarMenuItem>
                          ))
                        ) : (
                          <SidebarMenuItem>
                            <p className="p-2 text-sm text-muted-foreground text-center w-full italic">
                              Brak kanałów.
                            </p>
                          </SidebarMenuItem>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </>
                );
              })()
            )
          )}
        </SidebarGroup>
      </SidebarContent>

      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
      />

      <DeleteChannelDialog
        channelId={selectedChannelOptions?.id || ''}
        isOpen={showDeleteChannelModal}
        onClose={() => setShowDeleteChannelModal(false)}
      />

      {selectedChannelOptions && (
        <EditChannelModal
          existingChannel={selectedChannelOptions}
          isOpen={showEditChannelModal}
          onClose={() => setShowEditChannelModal(false)}
        />
      )}

      {selectedServer && <ServerInfoModal isOpen={isServerDetailsOpen} onClose={() => setServerDetailsOpen(false)} server={selectedServer} />}
    </Sidebar>
  );
}
