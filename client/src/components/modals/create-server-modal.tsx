import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, Camera, X } from 'lucide-react';
import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 5000000 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const createServerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(50, 'Maksymalnie 50 znaków'),
  description: z
    .string()
    .max(1000, 'Maksymalnie 1000 znaków')
    .optional()
    .or(z.literal('')),
  image: z
    .custom<File | undefined>()
    .refine((file) => !file || file?.size <= MAX_FILE_SIZE, {
      message: "Maksymalny rozmiar pliku to 5MB",
    })
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type), {
      message: "Tylko formaty .jpg, .jpeg, .png, .webp są wspierane",
    })
    .optional(),
});

type CreateServerValues = z.infer<typeof createServerSchema>;

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateServerModal = ({ isOpen, onClose }: CreateServerModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateServerValues>({
    resolver: zodResolver(createServerSchema),
    mode: 'onChange',
  });

  const createServer = useAppStore((state) => state.createServer);
  const selectServer = useAppStore((state) => state.selectServer);

  const submitHandler = async (data: CreateServerValues) => {
    try {
      const newServer = await createServer(
        data.name.trim(),
        data.description?.trim(),
        data.image
      );

      if (newServer) {
        selectServer(newServer.id);
        onClose();
        reset();
      }
    } catch (err) {
      console.error('API error creating server:', err);
    }
  };

  const handleClose = () => {
    reset();
    setImagePreview(null)
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
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
          <DialogTitle>Utwórz nowy serwer</DialogTitle>
          <DialogDescription>
            Jeden formularz dzieli cię od utworzenia nowego serwera.
          </DialogDescription>
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
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {imagePreview ? (
                  <img
                    src={imagePreview}
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
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Opis</Label>
            <Input
              id="description"
              placeholder="Super opis"
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleClose}
              >
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Tworzenie…' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
