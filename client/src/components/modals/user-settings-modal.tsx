import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useContext } from "react"
import AuthContext from "@/context/AuthProvider"
import { cn } from "@/lib/utils"
import { AboutSettingsCard } from "./user-settings-modal/about-settings-card"
import { ChangePasswordSettingsCard } from "./user-settings-modal/change-password-settings-card"
import { AdminOptionsSettingsCard } from "./user-settings-modal/admin-options-settings-card"
import { AccountSettingsCard } from "./user-settings-modal/account-settings-card"

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user } = useContext(AuthContext);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ustawienia</DialogTitle>
          <DialogDescription>Zmodyfikuj swoje ustawienia konta</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className={cn("grid w-full", user.role === "Owner" ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="account">Konto</TabsTrigger>
            <TabsTrigger value="password">Hasło</TabsTrigger>
            <TabsTrigger value="other">Pozostałe</TabsTrigger>
            {user.role === "Owner" && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <div className="min-h-[400px] mt-4">
            <TabsContent value="account" className="mt-0">
              <AccountSettingsCard />
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <ChangePasswordSettingsCard />
            </TabsContent>

            <TabsContent value="other" className="mt-0">
              <AboutSettingsCard />
            </TabsContent>

            { /* section that only owner can see */ }
            {user.role === "Owner" && (
              <TabsContent value="admin" className="mt-0">
                <AdminOptionsSettingsCard />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
