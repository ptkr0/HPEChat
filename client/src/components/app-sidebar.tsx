import { Home } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { NavServers } from "./nav-servers";
import { NavUsers } from "./nav-users";
import { Server } from "@/types/server.types";
import { PrivateMessageList } from "@/types/private-message.types";
import { NavUser } from "./nav-user";

const servers: Server[] = [
    {
        id: "1",
        name: "Server 1",
        description: "Description 1",
        owner: "Owner 1",
    },
    {
        id: "2",
        name: "Server 2",
        description: "Description 2",
        owner: "Owner 2",
    },
    {
        id: "3",
        name: "Server 3",
        description: "Description 3",
        owner: "Owner 3",
    },
    {
        id: "4",
        name: "Server 4",
        description: "Description 4",
        owner: "Owner 4",
    },
    {
        id: "5",
        name: "Server 5",
        description: "Description 5",
        owner: "Owner 5",
    },
];

const users: PrivateMessageList[] = [
    { id: "1", name: "User 1", lastMessage: "Hello", time: "10:00" },
    { id: "2", name: "User 2", lastMessage: "Hi", time: "10:05" },
    { id: "3", name: "User 3", lastMessage: "How are you?", time: "10:10" },
    { id: "4", name: "User 4", lastMessage: "Good morning", time: "10:15" },
];

const user = {
    id: "1",
    name: "User 1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=122",
};

export function AppSidebar() {
    return (
        <Sidebar collapsible='none' className='h-screen'>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href={`/home`} className='flex items-center'>
                                <Home className='size-4 shrink-0' />
                                <span className='ml-2'>Dom</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className='custom-scrollbar'>
                <SidebarGroup>
                    <SidebarGroupContent>
                        {/* Servers navigation */}
                        <SidebarMenu>
                            <NavServers servers={servers} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupContent>
                        {/* Users navigation */}
                        <SidebarMenu>
                            <NavUsers users={users} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
