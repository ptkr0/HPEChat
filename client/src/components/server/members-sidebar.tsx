// components/sidebar/members-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/stores/appStore";

export function MembersSidebar() {
  const { members } = useAppStore();

  return (
    <Sidebar className="w-56 border-l" side="right" collapsible="none">
      <SidebarHeader className="px-3 py-2 font-semibold">
        Użytkownicy ({members.length})
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {members.map((m) => (
            <SidebarMenuItem key={m.id} className="flex items-center gap-3">
              <Avatar className="size-7">
                <AvatarImage alt={m.username} />
                <AvatarFallback>{m.username[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{m.username}</span>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
