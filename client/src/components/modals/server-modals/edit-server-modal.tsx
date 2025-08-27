import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, Upload, X, RotateCcw } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ACCEPTED_AVATAR_TYPES, MAX_PROFILE_PICTURE_SIZE } from "@/constants/constants"
import { useAppStore } from "@/stores/useAppStore"
import type { Server } from "@/types/server.types"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const editServerSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(50, "Maksymalnie 50 znaków"),
  description: z.string().max(1000, "Maksymalnie 1000 znaków").optional().or(z.literal("")),
  image: z
    .custom<File | undefined>()
    .refine((file) => !file || file?.size <= MAX_PROFILE_PICTURE_SIZE, {
      message: "Maksymalny rozmiar pliku to 5MB",
    })
    .refine((file) => !file || ACCEPTED_AVATAR_TYPES.includes(file?.type), {
      message: "Tylko formaty .jpg, .jpeg, .png, .webp są wspierane",
    })
    .optional(),
})

type EditServerValues = z.infer<typeof editServerSchema>

interface EditServerModalProps {
  existingServer: Server
  isOpen: boolean
  onClose: () => void
}

export const EditServerModal = ({ existingServer, isOpen, onClose }: EditServerModalProps) => {
  const serverImageBlob = useAppStore((state) => state.serverImageBlobs.get(existingServer.id))
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const originalValues = useCallback(
    () => ({
      name: existingServer.name,
      description: existingServer.description,
      image: serverImageBlob || null,
    }),
    [existingServer.name, existingServer.description, serverImageBlob],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditServerValues>({
    resolver: zodResolver(editServerSchema),
    mode: "onChange",
    defaultValues: {
      name: existingServer.name,
      description: existingServer.description,
    },
  })

  const watchedValues = watch()
  const watchedImage = watch("image")

  const hasChanges = useCallback(() => {
    const original = originalValues()
    const currentName = watchedValues.name?.trim() || ""
    const currentDescription = watchedValues.description?.trim() || ""
    const originalName = original.name?.trim() || ""
    const originalDescription = original.description?.trim() || ""

    const nameChanged = currentName !== originalName
    const descriptionChanged = currentDescription !== originalDescription
    const imageChanged = watchedImage !== undefined || imagePreview !== original.image

    return nameChanged || descriptionChanged || imageChanged
  }, [watchedValues, watchedImage, imagePreview, originalValues])

  const submitHandler = async (data: EditServerValues) => {
    try {
      console.log(data)
    } catch (err) {
      console.error("API error creating server:", err)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    onClose()

    // delay reset until after modal close animation
    setTimeout(() => {
      reset()
      setImagePreview(null)
      setIsClosing(false)
    }, 300)
  }

  const handleReset = () => {
    const original = originalValues()
    reset({
      name: original.name,
      description: original.description,
    })
    setImagePreview(original.image)
    setValue("image", undefined, { shouldValidate: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    if (isOpen && !isClosing) {
      const original = originalValues()
      reset({
        name: original.name,
        description: original.description,
      })
      
      // set image preview immediately when modal opens
      setImagePreview(original.image)
    }
  }, [isOpen, isClosing, reset, originalValues])

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.blur()
    }
  }, [isOpen])

  const handleFileSelect = (file: File) => {
    if (file && ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setValue("image", file, { shouldValidate: true })

      // create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
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
    setValue("image", undefined, { shouldValidate: true })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj swój serwer.</DialogTitle>
          <DialogDescription>Zmodyfikuj szczegóły swojego serwera.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <div
                className={`
                  relative w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden
                  ${isDragOver ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/25 hover:border-primary/50"}
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                  ${imagePreview ? "border-solid border-muted-foreground/50" : ""}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_AVATAR_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {imagePreview ? (
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    className="w-full h-full object-cover"
                    alt="Server preview"
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

                {/* overlay for drag state when avatar exists */}
                {imagePreview && isDragOver && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-full">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>

              {imagePreview && (
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
                {imagePreview ? "Kliknij lub przeciągnij aby zmienić" : "Dodaj zdjęcie serwera"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP do 5MB</p>
            </div>

            {errors.image && <p className="text-xs text-red-500">{errors.image.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="name">
              Nazwa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Mój serwer"
              {...register("name")}
              disabled={isSubmitting}
              autoFocus={false}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Opis</Label>
            <Input id="description" placeholder="Super opis" {...register("description")} disabled={isSubmitting} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
              className="mr-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetuj
            </Button>

            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isValid || !hasChanges()}>
              {isSubmitting ? "Edytowanie…" : "Edytuj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
