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
    {
        id: "6",
        name: "Server 6",
        description: "Description 6",
        owner: "Owner 6",
    },
    {
        id: "7",
        name: "Server 7",
        description: "Description 7",
        owner: "Owner 7",
    },
    {
        id: "8",
        name: "Server 8",
        description: "Description 8",
        owner: "Owner 8",
    },
    {
        id: "9",
        name: "Server 9",
        description: "Description 9",
        owner: "Owner 9",
    },
    {
        id: "10",
        name: "Server 10",
        description: "Description 10",
        owner: "Owner 10",
    },
];

const users: PrivateMessageList[] = [
    { id: "1", name: "User 1", lastMessage: "Hello", time: "10:00" },
    { id: "2", name: "User 2", lastMessage: "Hi", time: "10:05" },
    { id: "3", name: "User 3", lastMessage: "How are you?", time: "10:10" },
    { id: "4", name: "User 4", lastMessage: "Good morning", time: "10:15" },
    { id: "5", name: "User 5", lastMessage: "Good night", time: "10:20" },
    { id: "6", name: "User 6", lastMessage: "See you later", time: "10:25" },
    { id: "7", name: "User 7", lastMessage: "Take care", time: "10:30" },
    { id: "8", name: "User 8", lastMessage: "Bye", time: "10:35" },
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
