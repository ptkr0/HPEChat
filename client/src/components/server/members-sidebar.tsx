import { useContext } from "react"
import { Crown, LogOut, MoreHorizontal, Shield } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useAppStore } from "@/stores/appStore"
import AuthContext from "@/context/AuthProvider"
import { User } from "@/types/user.type"

export function MembersSidebar() {
  const { user, loading } = useContext(AuthContext)
  const selectedServer = useAppStore((state) => state.selectedServer)
  const serverDetailsLoading = useAppStore((state) => state.serverDetailsLoading)
  const kickUser = useAppStore((state) => state.kickUser)
  const avatarBlobs = useAppStore((state) => state.avatarBlobs);

  const groupedMembers = () => {
    if (!selectedServer?.members) return { owner: [], admins: [], members: [] }

    const owner = selectedServer.members.filter((m) => m.id === selectedServer.ownerId)
    const admins = selectedServer.members.filter((m) => m.id !== selectedServer.ownerId && m.role === "admin")
    const regularMembers = selectedServer.members.filter((m) => m.id !== selectedServer.ownerId && m.role !== "admin")

    const sortByUsername = (a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase())

    return {
      owner: owner.sort(sortByUsername),
      admins: admins.sort(sortByUsername),
      members: regularMembers.sort(sortByUsername),
    }
  }

  const { owner, admins, members } = groupedMembers()
  const totalMembers = selectedServer?.members?.length || 0

  const renderMemberItem = (member: User) => {
    const isOwner = member.id === selectedServer?.ownerId
    const isAdmin = member.role === "admin"
    const memberBlobImage = avatarBlobs.get(member.id);

    return (
      <SidebarMenuItem key={member.id}>
        <SidebarMenuButton className="group relative transition-all duration-200 hover:bg-accent/50 rounded-lg mb-1">
          <div className="relative">
            <Avatar className="size-9 shrink-0 border-2 border-transparent group-hover:border-primary/10">
              <AvatarImage src={memberBlobImage || (member.image ? '' : undefined)} />
              <AvatarFallback>{member.username[0]}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex min-w-0 flex-1 flex-col ml-2">
            <span className="flex items-center text-sm font-medium">
              <span className="truncate">{member.username}</span>
              {isOwner && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Crown className="ml-1.5 text-amber-400 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top">Właściciel Serwera</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Shield className="ml-1.5 text-blue-400 h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top">Admin</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
          </div>
        </SidebarMenuButton>

        {selectedServer?.ownerId === user.id.toUpperCase() && member.id !== selectedServer.ownerId && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction className="bg-muted/80 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" align="center" className="w-48">
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-500"
                onClick={() => kickUser(selectedServer.id, member.id)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Wyrzuć użytkownika</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar className="w-64 border-l border-border/50" side="right" collapsible="none">
      <SidebarHeader className="border-b border-border/50 pb-2">
        <div className="flex items-center justify-between px-2">
          <SidebarGroupLabel className="font-semibold text-base">Członkowie</SidebarGroupLabel>
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
            {totalMembers}
          </Badge>
        </div>
      </SidebarHeader>

      <ScrollArea className="h-[calc(100vh-56px)]">
        <SidebarContent>
          {serverDetailsLoading || !selectedServer || loading ? (
            <SidebarGroup>
              <SidebarGroupContent>
                {[...Array(5)].map((_, i) => (
                  <div className="flex items-center py-2 px-3 w-full" key={i}>
                    <Skeleton className="size-9 rounded-full shrink-0" />
                    <div className="ml-3 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </div>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <>
              {owner.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-1">
                    WŁAŚCICIEL
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{owner.map(renderMemberItem)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {admins.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-1">
                    ADMINISTRATORZY — {admins.length}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{admins.map(renderMemberItem)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {members.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-1">
                    CZŁONKOWIE — {members.length}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{members.map(renderMemberItem)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </>
          )}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  )
}
