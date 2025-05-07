import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar"
import { PrivateMessageList } from "@/types/private-message.types"

export function NavUsers({ users }: {users: PrivateMessageList[]}) {
    return (
        <div className="mt-2">
          <SidebarGroupLabel className="text-base font-semibold">Użytkownicy</SidebarGroupLabel>
          <SidebarMenu>
            {users.map((user) => (
              <SidebarMenuButton size={"lg"} asChild key={user.id} className="py-6 px-2">
                <a
                  href={`/user/${user.id}`}
                  className="flex items-center gap-3"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs text-muted-foreground">{user.lastMessage}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground ml-1">{user.time}</span>
                    </div>
                  </div>
                </a>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>
        </div>
      )
}
