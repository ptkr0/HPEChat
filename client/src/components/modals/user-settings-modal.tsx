import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { useContext } from "react"
import AuthContext from "@/context/AuthProvider"
import { cn } from "@/lib/utils"
import { AboutUserSettingsCard } from "./user-settings-modal/about-user-settings-card"
import { ChangePasswordSettingsCard } from "./user-settings-modal/change-password-settings-card"

interface UserSettingsModal {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModal) {
  const { user } = useContext(AuthContext);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Ustawienia</DialogTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Konto</CardTitle>
                  <CardDescription>
                    Zarządzaj tutaj ustawieniami swojego konta, zapisz zmiany, aby je zastosować.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nazwa</Label>
                    <Input id="name" defaultValue={user.username} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Zapisz zmiany</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <ChangePasswordSettingsCard />
            </TabsContent>

            <TabsContent value="other" className="mt-0">
              <AboutUserSettingsCard />
            </TabsContent>

            { /* section that only owner can see */ }
            <TabsContent value="admin" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Opcje administracyjne</CardTitle>
                  <CardDescription>Jednym kliknięciem usuń całą bazę danych.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Label htmlFor="password">Potwierdź hasło</Label>
                  <Input id="password" type="password" />
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" className="w-full">
                    Usuń bazę danych
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
