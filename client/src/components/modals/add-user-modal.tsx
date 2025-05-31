import type React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Upload, X, Camera } from "lucide-react"
import { userService } from "@/services/userService"
import { toast } from "sonner"

const MAX_FILE_SIZE = 5000000 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const addUserSchema = z.object({
  username: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .regex(/^[a-zA-Z0-9_]+$/, "Tylko litery, cyfry i podkreślenia")
    .max(30, "Maksymalnie 30 znaków"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
    .regex(/^\S*$/, "Hasło nie może zawierać spacji")
    .max(200, "Maksymalnie 200 znaków"),
  avatar: z
    .custom<File | undefined>()
    .refine((file) => !file || file?.size <= MAX_FILE_SIZE, {
      message: "Maksymalny rozmiar pliku to 5MB",
    })
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type), {
      message: "Tylko formaty .jpg, .jpeg, .png, .webp są wspierane",
    })
    .optional(),
})

type AddUserValues = z.infer<typeof addUserSchema>

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddUserModal = ({ isOpen, onClose }: CreateServerModalProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AddUserValues>({
    resolver: zodResolver(addUserSchema),
    mode: "onChange",
  })

  const handleFileSelect = (file: File) => {
    if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setValue("avatar", file, { shouldValidate: true })

      // Create preview URL
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
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
    setValue("avatar", undefined, { shouldValidate: true })
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const submitHandler = async (data: AddUserValues) => {
    try {
      const newUser = await userService.register(data.username.trim(), data.password.trim(), data.avatar)

      if (newUser) {
        onClose()
        reset()
        setAvatarPreview(null)
      }
    } catch (err) {
      console.error("API error registering user:", err)
      toast.error("Błąd podczas dodawania użytkownika. Możliwe, że nazwa użytkownika jest już zajęta.")
    }
  }

  const handleClose = () => {
    reset()
    setAvatarPreview(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Dodaj użytkownika</DialogTitle>
          <DialogDescription>Mało nas do pieczenia chleba.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">

          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <div
                className={`
                  relative w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden
                  ${isDragOver ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/25 hover:border-primary/50"}
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                  ${avatarPreview ? "border-solid border-muted-foreground/50" : ""}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                    {isDragOver ? (
                      <Upload className="w-6 h-6 text-primary mb-1" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                    )}
                  </div>
                )}

                {/* Overlay for drag state when avatar exists */}
                {avatarPreview && isDragOver && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-full">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>

              {avatarPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 shadow-md"
                  onClick={removeAvatar}
                  disabled={isSubmitting}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {avatarPreview ? "Kliknij lub przeciągnij aby zmienić" : "Dodaj zdjęcie profilowe"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP do 5MB</p>
            </div>

            {errors.avatar && <p className="text-xs text-red-500">{errors.avatar.message}</p>}
          </div>

          {/* Username Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="username">
              Login <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="username" 
              placeholder="Nowy ziutek" 
              autoComplete="off" 
              {...register("username")} 
              disabled={isSubmitting} />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>

          {/* Password Field */}
          <div className="grid gap-1.5">
            <Label htmlFor="password">
              Hasło <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              autoComplete="off"
              placeholder="Tajne hasło"
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleClose}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "Dodawanie..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
