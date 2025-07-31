import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { PrivateMessageList } from "@/types/private-message.types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, UserPlus } from "lucide-react"
import { useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import clsx from "clsx"
import AuthContext from "@/context/AuthProvider"
import { AddUserModal } from "../modals/add-user-modal"
import { ScrollArea } from "../ui/scroll-area"

export function NavUsers({ users }: {users: PrivateMessageList[]}) {
  const {user, loading } = useContext(AuthContext)
  const [isUsersOpen, setIsUsersOpen] = useState(true)
  const [dropdownMenu, setDropdownMenu] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)

  // calculate height based on number of users
  // each user item is approximately 64px (py-6 means 24px top + 24px bottom + content)
  const itemHeight = 64 // approximate height of each user item
  const maxHeight = window.innerHeight * 0.3 // 30vh in pixels
  const calculatedHeight = Math.min(users.length * itemHeight, maxHeight)
  const scrollAreaHeight = users.length > 0 ? calculatedHeight : 60 // minimum height when no users

  return (
      <div className="mt-2">
        <Collapsible open={isUsersOpen} onOpenChange={setIsUsersOpen} className="group/collapsible">
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="text-base font-semibold">Użytkownicy</SidebarGroupLabel>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-center">
                  <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <ScrollArea className="pr-3" style={{ height: `${scrollAreaHeight}px` }} type="hover">
              <SidebarMenu className="mt-1">
                {users.map((user) => (
                  <SidebarMenuButton size={"lg"} asChild key={user.id} className="py-6 px-2">
                    <a
                      href={`/user/${user.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt={user.name} />
                        <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
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
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

    {!loading && (user.role === "Admin" || user.role === "Owner") && (
    <SidebarMenuItem className="mt-1">
      <div className="relative">
        <SidebarMenuButton
          onClick={() => setDropdownMenu(!dropdownMenu)}
          className="flex justify-center border-1 border-border"
        >
          <div className="flex size-6 items-center justify-center rounded-full">
            <UserPlus />
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
            className="w-full text-left px-3 py-2 text-sm rounded-sm"
            onClick={() => setShowAddUserModal(true)}
          >
            Dodaj użytkownika
          </Button>
        </div>
      </div>
    </SidebarMenuItem>
    )}

    <AddUserModal isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} />
    </div>
    )
}
