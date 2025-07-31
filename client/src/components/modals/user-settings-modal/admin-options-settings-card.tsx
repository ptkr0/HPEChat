import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"

export function AdminOptionsSettingsCard() {
  return (
    <>
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
    </>
  )
}