import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { toast } from 'sonner';
import { Channel } from '@/types/channel.types';
import { channelService } from '@/services/channelService';
import { useEffect } from 'react';

const editChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .regex(/^[a-zA-Z0-9_]+$/, "Tylko litery, cyfry i podkreślenia")
    .max(50, 'Maksymalnie 50 znaków')
});

type EditChannelValues = z.infer<typeof editChannelSchema>;

interface EditChannelModalProps {
  existingChannel: Channel;
  isOpen: boolean;
  onClose: () => void;
}

export const EditChannelModal = ({ existingChannel, isOpen, onClose }: EditChannelModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditChannelValues>({
    resolver: zodResolver(editChannelSchema),
    mode: 'onChange',
    defaultValues: {
      name: existingChannel.name,
    },
  });
  const hasNameChanges = watch("name") !== existingChannel.name;

  const submitHandler = async (data: EditChannelValues) => {
    try {
      const editedChannel = await channelService.edit(
        existingChannel.id,
        data.name.trim()
      );

      if (editedChannel) {
        onClose();
        toast.success('Kanał został zaktualizowany');
        reset();
      }
    } catch (err) {
      console.error('API error editing channel:', err);
    }
  };

  useEffect(() => {
    reset({
      name: existingChannel.name,
    })
  }, [existingChannel.name, reset])

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj kanał</DialogTitle>
          <DialogDescription>
            Zmień nazwę kanału.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              Nazwa<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nazwa"
              disabled={isSubmitting}
              autoFocus={false}
              {...register("name")}
            />
            <div className="min-h-[16px] w-full">
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
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
            <Button type="submit" disabled={isSubmitting || !isValid || !hasNameChanges}>
              {isSubmitting ? 'Tworzenie…' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
