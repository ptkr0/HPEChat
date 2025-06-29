import { Plus, Loader2, MoreHorizontal, LogOut, Trash2, ChevronDown } from "lucide-react"
import { SidebarGroupLabel, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar"
import type { Server } from "@/types/server.types"
import clsx from "clsx"
import { Button } from "../ui/button"
import { useContext, useState } from "react"
import { CreateServerModal } from "../modals/create-server-modal"
import { useAppStore } from "@/stores/appStore"
import { Skeleton } from "../ui/skeleton"
import { JoinServerModal } from "../modals/join-server-modal"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import AuthContext from "@/context/AuthProvider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "../ui/scroll-area"

interface NavServersProps {
  servers: Server[]
  selectedServerId: string | null
  onServerSelect: (serverId: string) => void
  onLeaveServer: (serverId: string) => void
}

export function NavServers({ servers, selectedServerId, onServerSelect, onLeaveServer }: NavServersProps) {
  const { user, loading } = useContext(AuthContext)
  const [dropdownMenu, setDropdownMenu] = useState(false)
  const [showCreateServerModal, setShowCreateServerModal] = useState(false)
  const [showJoinServerModal, setShowJoinServerModal] = useState(false)
  const serversLoading = useAppStore((state) => state.serversLoading)
  const [isServersOpen, setIsServersOpen] = useState(true)
  const serverImageBlobs = useAppStore((state) => state.serverImageBlobs)

  const sortedServers = servers.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
    return 0
  });

  return (
    <div>
      <Collapsible open={isServersOpen} onOpenChange={setIsServersOpen} className="group/collapsible">
        <div className="flex items-center justify-between">
          <SidebarGroupLabel className="text-base font-semibold">Serwery</SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-center">
                <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="mt-1 space-y-0.5">
            <ScrollArea className="h-[300px] pr-3" type="hover">
            {serversLoading || loading ? (
              <Skeleton className="h-20 w-full mb-2 flex items-center justify-center">
                <Loader2 className="animate-spin" />
              </Skeleton>
            ) : (

              sortedServers.map((server) => (
                <SidebarMenuItem key={server.id}>
                  <SidebarMenuButton
                    size={"lg"}
                    onClick={() => onServerSelect(server.id)}
                    className={clsx("flex items-center", {
                      "bg-accent text-accent-foreground": server.id === selectedServerId,
                    })}
                  >
                    {(() => {
                      const serverImage = serverImageBlobs.get(server.id);
                      return (
                      <Avatar className="size-10 rounded-lg flex items-center justify-center shrink-0 mr-2 overflow-hidden">
                        <AvatarImage src={serverImage || (serverImage ? '' : undefined)} />
                        <AvatarFallback className="bg-muted flex items-center justify-center text-sm font-medium w-full h-full">
                        {server.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      );
                    })()}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="truncate font-medium">{server.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{server.description}</div>
                    </div>
                  </SidebarMenuButton>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontal />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="center">
                      {server.ownerId.toUpperCase() === user.id.toUpperCase() ? (
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span className="text-red-500 focus:text-red-500">Usuń Serwer</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onLeaveServer(server.id)}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span className="text-red-500 focus:text-red-500">Opuść Serwer</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))

            )}
                          </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Dropdown "More" section - kept outside the collapsible */}
      <SidebarMenuItem className="mt-1">
        <div className="relative">
          <SidebarMenuButton
            onClick={() => setDropdownMenu(!dropdownMenu)}
            className="flex justify-center border-1 border-border"
          >
            <div className="flex size-6 items-center justify-center rounded-full">
              <Plus />
            </div>
          </SidebarMenuButton>

          <div
            className={clsx(
              "absolute left-0 mt-1 w-full bg-popover rounded-md shadow-md p-1 z-10 transition-all duration-300 ease-in-out border-1 border-border",
              {
                "opacity-0 pointer-events-none": !dropdownMenu,
                "opacity-100": dropdownMenu,
              },
            )}
          >
            <Button
              variant={"ghost"}
              onClick={() => setShowJoinServerModal(true)}
              className="w-full text-left px-3 py-2 text-sm rounded-sm"
            >
              Dołącz do serwera
            </Button>
            <DropdownMenuSeparator />
            <Button
              variant={"ghost"}
              onClick={() => setShowCreateServerModal(true)}
              className="w-full text-left px-3 py-2 text-sm rounded-sm"
            >
              Załóż nowy serwer
            </Button>
          </div>
        </div>
      </SidebarMenuItem>

      <CreateServerModal isOpen={showCreateServerModal} onClose={() => setShowCreateServerModal(false)} />

      <JoinServerModal isOpen={showJoinServerModal} onClose={() => setShowJoinServerModal(false)} />
    </div>
  )
}
