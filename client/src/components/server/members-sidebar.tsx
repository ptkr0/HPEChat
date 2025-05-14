import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/stores/appStore";
import { Skeleton } from "../ui/skeleton";
import { Crown } from "lucide-react";

export function MembersSidebar() {
  const { members } = useAppStore();
  const selectedServer = useAppStore((state) => state.selectedServer);
  const serverDetailsLoading = useAppStore((state) => state.serverDetailsLoading);

  const sortedMembers = [...members].sort((a, b) => {
    if (a.username.toLowerCase() < b.username.toLowerCase()) return -1;
    if (a.username.toLowerCase() > b.username.toLowerCase()) return 1;
    return 0;
  });

  return (
    <Sidebar className="w-60 border-l" side="right" collapsible="none">
      <SidebarHeader>
        <SidebarGroupLabel className="font-semibold text-lg">Członkowie ({members.length})</SidebarGroupLabel>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
          {serverDetailsLoading || !selectedServer ? (
            <>
              {[...Array(3)].map(() => (
                  <div className="flex items-center py-1 px-2 w-full">
                    <Skeleton className="size-6 rounded-full shrink-0" />
                    <div className="ml-3 flex-1">
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                    </div>
                  </div>
              ))}
            </>
          ) : (
            <>
              {sortedMembers.map((m) => (
                <SidebarMenuButton size={"default"} key={m.id} className="mb-2">
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`} alt={m.username} />
                    <AvatarFallback>{m.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium flex items-center">
                      {m.id === selectedServer!.ownerId ? <Crown className="mr-1 text-yellow-300" size={20}/> : null}
                      <span>{m.username}</span>
                    </span>
                  </div>
                </SidebarMenuButton>
              ))}
            </>
          )}
            </SidebarGroupContent>
          </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
