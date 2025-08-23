import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

interface FormAlertProps {
  type: "success" | "error"
  message: string
  small?: boolean
}

export function FormAlert({ type, message, small = false }: FormAlertProps) {
  const Icon = type === "success" ? CheckCircle : AlertCircle
  const variant = type === "success" ? "default" : "destructive"

  return (
    <Alert
      variant={variant}
      className={`${small ? "py-2 flex items-center gap-2" : "border-l-4 flex items-center gap-2"}`}
    >
      <span className="flex items-center">
        <Icon className={small ? "size-4" : "h-4 w-4"} />
      </span>
      <AlertDescription className={small ? "text-xs" : "font-medium"}>
        {message}
      </AlertDescription>
    </Alert>
  )
}