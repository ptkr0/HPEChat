import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { userService } from "@/services/userService"
import { FormAlert } from "../simple-alert"

const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Hasło jest wymagane")
      .regex(/^\S*$/, "Hasło nie może zawierać spacji")
      .max(200, "Maksymalnie 200 znaków"),
    newPassword: z
      .string()
      .min(1, "Hasło jest wymagane")
      .regex(/^\S*$/, "Hasło nie może zawierać spacji")
      .max(200, "Maksymalnie 200 znaków"),
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "Hasło musi być inne niż aktualne",
    path: ["newPassword"],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

interface FeedbackState {
  type: "success" | "error" | null
  message: string
}

export function ChangePasswordSettingsCard() {
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: "" })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  })

  const submitHandler = async (data: ChangePasswordValues) => {
    
    setFeedback({ type: null, message: "" }) // reset feedback state
    try {
      await userService.password(data.oldPassword, data.newPassword)
      setFeedback({ type: "success", message: "Hasło zostało pomyślnie zmienione." })
      reset()
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      if (err.response?.data === "Invalid password") {
        setError("oldPassword", {
          type: "manual",
          message: "Nieprawidłowe aktualne hasło.",
        })
      } else {
        setFeedback({ type: "error", message: err.response?.data || "Wystąpił błąd podczas zmiany hasła." })
      }
      console.error("API error changing password:", err)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
              <CardTitle>Hasło</CardTitle>
            <CardDescription>
              Zmień tutaj swoje hasło. Upewnij się, że jest ono silne i unikalne.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* on submit feedback */}
            {feedback.type && (
              <FormAlert type={feedback.type} message={feedback.message} />
            )}

            <div className="space-y-4">

              {/* old password field */}
              <div className="space-y-3">
                <Label htmlFor="old-password" className="text-sm font-medium">
                  Aktualne hasło
                </Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="Wprowadź aktualne hasło"
                  className={`transition-colors ${errors.oldPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("oldPassword")}
                  disabled={isSubmitting}
                />
                {errors.oldPassword && (
                    <FormAlert type="error" message={errors.oldPassword.message || ""} small />
                )}
              </div>

              {/* new password field */}
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  Nowe hasło
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Wprowadź nowe hasło"
                  className={`transition-colors ${errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  {...register("newPassword")}
                  disabled={isSubmitting}
                />
                {errors.newPassword && (
                    <FormAlert type="error" message={errors.newPassword.message || ""} small />
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Zapisywanie…' : 'Zapisz hasło'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}