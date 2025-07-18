import { Moon, PcCase, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
        className="flex items-center gap-2"
      >
        <Sun className="h-4 w-4" />
        Jasny
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="flex items-center gap-2"
      >
        <Moon className="h-4 w-4" />
        Ciemny
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
        className="flex items-center gap-2"
      >
        <PcCase className="h-4 w-4" />
        Systemowy
      </Button>
    </div>
  )
}
