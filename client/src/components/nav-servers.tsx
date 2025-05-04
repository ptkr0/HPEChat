import { Globe, ChevronDown, Plus } from "lucide-react"
import {
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Server } from "@/types/server.types"
import clsx from "clsx";
import { Button } from "./ui/button";
import { useState } from "react";
import { CreateServerModal } from "./create-server-modal";

interface NavServersProps {
  servers: Server[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string) => void;
}

export function NavServers({ servers, selectedServerId, onServerSelect }: NavServersProps) {

  const[dropdownMenu, setDropdownMenu] = useState(false);
  const[showCreateServerModal, setShowCreateServerModal] = useState(false);

  const handleCreateServer = () => {
    setShowCreateServerModal(true);
  };

  const handleCloseCreateServerModal = () => {
    setShowCreateServerModal(false);
  };



  const handleJoinServer = () => {
      console.log("Open join server modal");
  };
  

  return (
    <div className="mt-2">
      <SidebarGroupLabel className="text-base font-semibold">Serwery</SidebarGroupLabel>
      <div className="mt-1 space-y-0.5">
        {servers.map((server) => (
          <SidebarMenuItem key={server.id}>
            <SidebarMenuButton size={"lg"} onClick={() => onServerSelect(server.id)}
              className={clsx(
                'flex items-center w-full',
                { 'bg-accent text-accent-foreground': server.id === selectedServerId }
              )}
                >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Globe />
                </div>
                <span className="ml-2 truncate">{server.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </div>

          {/* Dropdown "More" section */}
          <SidebarMenuItem className="mt-1">
            <div className="relative">
                <SidebarMenuButton onClick={() => setDropdownMenu(!dropdownMenu)}>
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Plus />
                </div>
                <span className="ml-2">Więcej</span>
                <ChevronDown className={clsx(
                  "ml-auto size-4 transition-transform duration-200 ease-in-out",
                  { "rotate-180": dropdownMenu }
                )} />
                </SidebarMenuButton>

                <div
                className={clsx(
                  "absolute left-0 mt-1 w-full bg-popover rounded-md shadow-md p-1 z-10 transition-all duration-200 ease-in-out",
                  {
                    "opacity-0 translate-y-[-10px] pointer-events-none": !dropdownMenu,
                    "opacity-100 translate-y-0": dropdownMenu
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
    </div>
  )
}