import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NavServers } from "./nav-servers";
import { NavUsers } from "./nav-users";
import { PrivateMessageList } from "@/types/private-message.types";
import { NavUser } from "./nav-user";
import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useNavigate } from "react-router";

const users: PrivateMessageList[] = [
  { id: "1", name: "User 1", lastMessage: "Hello", time: "10:00" },
  { id: "2", name: "User 2", lastMessage: "Hi", time: "10:05" },
  { id: "3", name: "User 3", lastMessage: "How are you?", time: "10:10" },
  { id: "4", name: "User 4", lastMessage: "Good morning", time: "10:15" },
];

export function AppSidebar() {
  const servers = useAppStore((state) => state.servers);
  const selectedServer = useAppStore((state) => state.selectedServer);
  const fetchServers = useAppStore((state) => state.fetchServers);
  const selectServer = useAppStore((state) => state.selectServer);
  const leaveServer = useAppStore((state) => state.leaveServerAction);

  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleServerSelect = (serverId: string | null) => {
    console.log("Selecting server:", serverId);
    selectServer(serverId);

    if (serverId) {
      navigate(`/servers/${serverId}`);
    } else {
      navigate(`/home`);
    }
  };

  const handleLeaveServer = (serverId: string) => {
    leaveServer(serverId);
  }

  return (
    <Sidebar collapsible='none' className='h-screen border-r border-r-border'>
      <SidebarHeader>
        <SidebarMenuButton
          size={"lg"}
          onClick={() => handleServerSelect(null)}
          className={`py-3 ${!selectedServer ? "bg-accent" : ""}`}
        >
          <span className="font-semibold text-lg">HPEChat</span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* servers navigation */}
            <SidebarMenu>
              <NavServers
                servers={servers}
                selectedServerId={selectedServer ? selectedServer.id : null}
                onServerSelect={handleServerSelect}
                onLeaveServer={handleLeaveServer}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            {/* users navigation */}
            <SidebarMenu>
              <NavUsers users={users} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
