import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SidebarGroupLabel, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { PrivateMessageList } from "@/types/private-message.types"

export function NavUsers({ users }: {users: PrivateMessageList[]}) {
    return (
        <>
            <SidebarGroupLabel className="text-sm font-medium">Użytkownicy</SidebarGroupLabel>
            {users.map((user) => (
            <SidebarMenuItem key={user.id}>
                <SidebarMenuButton asChild>
                <a href={`/user/${user.id}`} className="flex items-center gap-3 my-1 py-1">
                    <Avatar className="size-8 shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center justify-between">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{user.time}</span>
                        </div>
                        <span className="truncate text-xs text-muted-foreground">{user.lastMessage}</span>
                    </div>
                </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
            ))}
        </>
    )
}
