import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"

export function ChangePasswordSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hasło</CardTitle>
        <CardDescription>Zmień tutaj swoje hasło. Upewnij się, że jest ono silne i unikalne.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="current-password">Aktualne hasło</Label>
          <Input id="current-password" type="password" />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="new-password">Nowe hasło</Label>
          <Input id="new-password" type="password" />
        </div>
      </CardContent>
      <CardFooter>
        <Button>Zapisz hasło</Button>
      </CardFooter>
    </Card>
  )
}
