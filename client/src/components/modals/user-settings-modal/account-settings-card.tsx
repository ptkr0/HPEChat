import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useContext, useRef, useState } from "react"
import { Camera, Upload, X, RotateCcw } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import AuthContext from "@/context/AuthProvider"
import { userService } from "@/services/userService"
import { ACCEPTED_AVATAR_TYPES, MAX_PROFILE_PICTURE_SIZE } from "@/constants/constants"
import { FormAlert } from "../simple-alert"
import { useAppStore } from "@/stores/useAppStore"

// username validation schema
const usernameSchema = z.object({
  username: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .regex(/^[a-zA-Z0-9_]+$/, "Tylko litery, cyfry i podkreślenia")
    .max(30, "Maksymalnie 30 znaków"),
})

// avatar validation schema
const avatarSchema = z.object({
  avatar: z
    .custom<File | undefined>()
    .refine((file) => !file || file?.size <= MAX_PROFILE_PICTURE_SIZE, {
      message: "Maksymalny rozmiar pliku to 5MB",
    })
    .refine((file) => !file || ACCEPTED_AVATAR_TYPES.includes(file?.type), {
      message: "Tylko formaty .jpg, .jpeg, .png, .webp są wspierane",
    })
    .optional(),
})

type UsernameValues = z.infer<typeof usernameSchema>
type AvatarValues = z.infer<typeof avatarSchema>

interface FeedbackState {
  type: "success" | "error" | null
  message: string
}

export function AccountSettingsCard() {
  const { user, setUser } = useContext(AuthContext);
  const avatarBlob = useAppStore((state) => state.avatarBlobs.get(user.id));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarBlob || null)
  const [originalAvatarPreview, setOriginalAvatarPreview] = useState<string | null>(avatarBlob || null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [usernameFeedback, setUsernameFeedback] = useState<FeedbackState>({ type: null, message: "" })
  const [avatarFeedback, setAvatarFeedback] = useState<FeedbackState>({ type: null, message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // username form
  const usernameForm = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    mode: "onChange",
    defaultValues: {
      username: user.username,
    },
  })

  // avatar form
  const avatarForm = useForm<AvatarValues>({
    resolver: zodResolver(avatarSchema),
    mode: "onChange",
  })

  const handleFileSelect = (file: File) => {

    if (file && ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      avatarForm.setValue("avatar", file, { shouldValidate: true })
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]

    if (file) {
      handleFileSelect(file)
    }
  }

  const removeAvatar = () => {
    avatarForm.setValue("avatar", undefined, { shouldValidate: true })
    setAvatarPreview(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetUsernameForm = () => {
    usernameForm.reset({ username: user.username })
    setUsernameFeedback({ type: null, message: "" })
  }

  const resetAvatarForm = () => {
    avatarForm.reset()
    setAvatarPreview(originalAvatarPreview)
    setAvatarFeedback({ type: null, message: "" })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onUsernameSubmit = async (data: UsernameValues) => {
    setUsernameFeedback({ type: null, message: "" })

    try {
      const result = await userService.username(data.username)
      setUsernameFeedback({
        type: result ? "success" : "error",
        message: result.message || "Nazwa użytkownika została zaktualizowana.",
      })
      setUser((prevUser) => ({
        ...prevUser,
        username: data.username,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setUsernameFeedback({
        type: "error",
        message: error.response?.data || "Wystąpił nieoczekiwany błąd",
      })
    }
  }

  const onAvatarSubmit = async (data: AvatarValues) => {
    setAvatarFeedback({ type: null, message: "" })

    try {
      const result = await userService.avatar(data.avatar || null)
      setAvatarFeedback({
        type: result ? "success" : "error",
        message: result.message || "Zdjęcie profilowe zostało zaktualizowane.",
      })

      // update the original preview to the new one
      if (result) {
        setUser((prevUser) => ({
          ...prevUser,
          image: result.user?.image || "",
        }))
        setOriginalAvatarPreview(avatarPreview)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setAvatarFeedback({
        type: "error",
        message: error.response?.data || "Wystąpił błąd podczas aktualizacji zdjęcia profilowego.",
      })
    }
  }

  const hasUsernameChanges = usernameForm.watch("username") !== user.username
  const hasAvatarChanges = avatarPreview !== originalAvatarPreview || avatarForm.watch("avatar") !== undefined

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Ustawienia konta</CardTitle>
        <CardDescription>Zarządzaj swoją nazwą użytkownika i zdjęciem profilowym</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* avatar section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Zdjęcie profilowe</Label>
          <form onSubmit={avatarForm.handleSubmit(onAvatarSubmit)}>
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div
                  className={`
                  relative w-20 h-20 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden
                  ${isDragOver ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/25 hover:border-primary/50"}
                  ${avatarForm.formState.isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                  ${avatarPreview ? "border-solid border-muted-foreground/50" : ""}
                `}
                  onDragOver={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !avatarForm.formState.isSubmitting && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_AVATAR_TYPES.join(",")}
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={avatarForm.formState.isSubmitting}
                  />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                      {isDragOver ? (
                        <Upload className="w-5 h-5 text-primary" />
                      ) : (
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  {avatarPreview && isDragOver && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-full">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0"
                    onClick={removeAvatar}
                    disabled={avatarForm.formState.isSubmitting}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">PNG, JPG, WEBP do 5MB</p>
                  <p className="text-xs text-muted-foreground">Kliknij lub przeciągnij aby zmienić</p>
                </div>
                {avatarForm.formState.errors.avatar && (
                  <p className="text-xs text-red-500">{avatarForm.formState.errors.avatar.message}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={avatarForm.formState.isSubmitting || !avatarForm.formState.isValid || !hasAvatarChanges}
                  >
                    {avatarForm.formState.isSubmitting ? "Zapisywanie…" : "Zapisz"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetAvatarForm}
                    disabled={avatarForm.formState.isSubmitting || !hasAvatarChanges}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              {avatarFeedback.type && (
                <FormAlert type={avatarFeedback.type} message={avatarFeedback.message} small />
              )}
            </div>
          </form>
        </div>

        {/* username section */}
        <div className="space-y-3">
          <Label htmlFor="username" className="text-sm font-medium">
            Nazwa użytkownika
          </Label>
          <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="username"
                  {...usernameForm.register("username")}
                  disabled={usernameForm.formState.isSubmitting}
                  className="h-9"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={usernameForm.formState.isSubmitting || !usernameForm.formState.isValid || !hasUsernameChanges}
              >
                {usernameForm.formState.isSubmitting ? "Zapisywanie…" : "Zapisz"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetUsernameForm}
                disabled={usernameForm.formState.isSubmitting || !hasUsernameChanges}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </form>
          {usernameForm.formState.errors.username && (
            <FormAlert type="error" message={usernameForm.formState.errors.username.message || ""} small />
          )}
          {usernameFeedback.type && (
            <FormAlert type={usernameFeedback.type} message={usernameFeedback.message} small />
          )}
        </div>
      </CardContent>
    </Card>
  )
}