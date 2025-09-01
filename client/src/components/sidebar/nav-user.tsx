import {
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import AuthContext from "@/context/AuthProvider"
import { useContext, useState } from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { userService } from "@/services/userService"
import { useAppStore } from "@/stores/useAppStore"
import { UserSettingsModal } from "../modals/user-settings-modal"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, setUser } = useContext(AuthContext);
  const clearServerSlice = useAppStore((state) => state.clearServerSlice);
  const clearChannelSlice = useAppStore((state) => state.clearChannelSlice);
  const avatarBlob = useAppStore((state) => state.avatarBlobs.get(user.id));
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const logOut = async () => {

    try {
      await userService.logout();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (err: any) {
      if (err.response?.status === 400) {
        toast.error("Błędne dane logowania");
      }
      else if (err.response?.status === 500) {
        toast.error("Błąd serwera");
      }
    }

    finally {
      setUser({ id: '', username: '', role: '', image: '' });
      clearServerSlice();
      clearChannelSlice();
      navigate("/login", { replace: true });
    }
  }


  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-10 rounded-full">
                  <AvatarImage src={avatarBlob} alt={user.username} />
                  <AvatarFallback className="rounded-full">{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.username}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-10 rounded-full">
                    <AvatarImage src={avatarBlob} alt={user.username} />
                    <AvatarFallback className="rounded-full">{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                { /*  this div fixes the issue with too much recursion error 
                      updating dependencies would probably also fix this issue */ }
                <div onClick={() => setShowSettingsModal(true)}>
                  <DropdownMenuItem>
                    <Settings />
                    Ustawienia
                  </DropdownMenuItem>
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut}>
                <LogOut />
                Wyloguj się
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <UserSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  )
}
