import { Globe, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Server } from "@/types/server.types"

export function NavServers({ servers }: {servers: Server[]}) {
  return (
    <div className="mt-2">
      <SidebarGroupLabel className="text-sm font-medium">Serwery</SidebarGroupLabel>
      <div className="mt-1 space-y-0.5">
        {servers.map((server) => (
          <SidebarMenuItem key={server.id}>
            <SidebarMenuButton asChild>
              <a href={`/${server.id}`} className="flex items-center">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Globe />
                </div>
                <span className="ml-2 truncate">{server.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </div>

      {/* Collapsible "More" section */}
      <Collapsible className="group/collapsible mt-1">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full">
                <Plus />
              </div>
              <span className="ml-2">Więcej</span>
              <ChevronRight className="ml-auto size-4 group-data-[state=open]/collapsible:hidden" />
              <ChevronDown className="ml-auto size-4 group-data-[state=closed]/collapsible:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <a href="#">Dołącz do serwera</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <a href="#">Załóż nowy serwer</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </div>
  )
}