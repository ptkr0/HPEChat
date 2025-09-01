import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppStore } from '@/stores/useAppStore';
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
import { channelService } from '@/services/channelService';

const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(50, 'Maksymalnie 50 znaków'),
});

type CreateChannelValues = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal = ({ isOpen, onClose }: CreateChannelModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateChannelValues>({
    resolver: zodResolver(createChannelSchema),
    mode: 'onChange',
  });

  const submitHandler = async (data: CreateChannelValues) => {
    try {
      const newChannel = await channelService.create({
        serverId: useAppStore.getState().selectedServer?.id || '',
        name: data.name.trim(),
      });

      if (newChannel) {
        onClose();
        reset();
      }
    } catch (err) {
      console.error('API error creating server:', err);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowy kanał</DialogTitle>
          <DialogDescription>
            Jeden formularz dzieli cię od dodania nowego kanału.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              Nazwa<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Super kanał"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
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
