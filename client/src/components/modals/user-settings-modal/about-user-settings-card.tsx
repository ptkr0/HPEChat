import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Globe, Github } from "lucide-react"

export function AboutUserSettingsCard() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Wygląd</CardTitle>
          <CardDescription>Wybierz motyw aplikacji, który najbardziej Ci odpowiada.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label>Motyw</Label>
            <ModeToggle />
          </div>
        </CardContent>
      </Card><Card className="mt-2">
          <CardHeader>
            <CardTitle>O aplikacji</CardTitle>
            <CardDescription>Jak coś nie działa to daj mi znać, a spróbuję to naprawić.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 mr-2">
            <div className="grid gap-3">
              <Label>Znajdź mnie tutaj</Label>
              <div className="flex flex-row">
                <a href="https://ptkr.me" target="_blank"><Button variant="link" className="mr-2">
                  <Globe />ptkr.me
                </Button>
                </a>
                <a href="https://github.com/ptkr0" target="_blank"><Button variant="link">
                  <Github />Github
                </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
  )
}