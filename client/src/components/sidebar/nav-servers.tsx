import { Plus, Loader2 } from "lucide-react"
import {
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Server } from "@/types/server.types"
import clsx from "clsx";
import { Button } from "../ui/button";
import { useState } from "react";
import { CreateServerModal } from "../modals/create-server-modal";
import { useAppStore } from "@/stores/appStore";
import { Skeleton } from "../ui/skeleton";
import { JoinServerModal } from "../modals/join-server-modal";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

interface NavServersProps {
  servers: Server[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string) => void;
}

export function NavServers({ servers, selectedServerId, onServerSelect }: NavServersProps) {

  const[dropdownMenu, setDropdownMenu] = useState(false);
  const[showCreateServerModal, setShowCreateServerModal] = useState(false);
  const[showJoinServerModal, setShowJoinServerModal] = useState(false);
  const serversLoading = useAppStore((state) => state.serversLoading);

  const handleCreateServer = () => {
    setShowCreateServerModal(true);
  };

  const handleCloseCreateServerModal = () => {
    setShowCreateServerModal(false);
  };

  const handleCloseJoinServerModal = () => {
    setShowJoinServerModal(false);
  };

  const handleJoinServer = () => {
    setShowJoinServerModal(true);
  };
  

  return (
    <div className="mt-2">
      <SidebarGroupLabel className="text-base font-semibold">Serwery</SidebarGroupLabel>
      <div className="mt-1 space-y-0.5">
      {serversLoading ? (
        <Skeleton className="h-20 w-full mb-2 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </Skeleton>
      ) : (
        servers.map((server) => (
          <SidebarMenuItem key={server.id}>
            <SidebarMenuButton size={"lg"} onClick={() => onServerSelect(server.id)}
              className={clsx(
                'flex items-center w-full',
                { 'bg-accent text-accent-foreground': server.id === selectedServerId }
              )}
            >
              <Avatar className="size-10 rounded-full flex items-center justify-center shrink-0 mr-2 overflow-hidden">
                <AvatarImage alt={server.name} />
                <AvatarFallback className="bg-muted text-foreground flex items-center justify-center text-sm font-medium w-full h-full">
                  {server.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="truncate font-medium">{server.name}</div>
                <div className="truncate text-xs text-muted-foreground">{server.description}</div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))
      )}
      </div>

          {/* Dropdown "More" section */}
          <SidebarMenuItem className="mt-1">
            <div className="relative">
              <SidebarMenuButton onClick={() => setDropdownMenu(!dropdownMenu)} className="flex justify-center border-1 border-border">
                <div className="flex size-6 items-center justify-center rounded-full">
                <Plus />
                </div>
              </SidebarMenuButton>

              <div
              className={clsx(
                "absolute left-0 mt-1 w-full bg-popover rounded-md shadow-md p-1 z-10 transition-all duration-300 ease-in-out",
                {
                "opacity-0 pointer-events-none": !dropdownMenu,
                "opacity-100": dropdownMenu
                }
              )}
              >
                <Button variant={"ghost"}
                  onClick={handleJoinServer}
                  className="w-full text-left px-3 py-2 text-sm rounded-sm"
                >
                  Dołącz do serwera
                </Button>
                <Button variant={"ghost"}
                  onClick={handleCreateServer}
                  className="w-full text-left px-3 py-2 text-sm rounded-sm"
                >
                  Załóż nowy serwer
                </Button>
              </div>
            </div>
          </SidebarMenuItem>

      <CreateServerModal
        isOpen={showCreateServerModal}
        onClose={handleCloseCreateServerModal}
      />

      <JoinServerModal
        isOpen={showJoinServerModal}
        onClose={handleCloseJoinServerModal}
      />
    </div>
  )
}