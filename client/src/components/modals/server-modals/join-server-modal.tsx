import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import { FormAlert } from '@/components/modals/simple-alert';

const joinServerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(50, 'Maksymalnie 20 znaków'),
});

type JoinServerValues = z.infer<typeof joinServerSchema>;

interface JoinServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinServerModal = ({ isOpen, onClose }: JoinServerModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = useForm<JoinServerValues>({
    resolver: zodResolver(joinServerSchema),
    mode: 'onChange',
  });

  const [error, setError] = useState<string | null>(null);
  const joinServer = useAppStore((state) => state.joinServer);
  const selectServer = useAppStore((state) => state.selectServer);
  const navigate = useNavigate();

  const submitHandler = async (data: JoinServerValues) => {
    try {
      setError(null);
      const newServer = await joinServer(data.name.trim());

      if (!newServer) {
        setError('Wystąpił błąd podczas dołączania do serwera.');
        return;
      }

      selectServer(newServer.id);
      navigate(`/servers/${newServer.id}`);
      toast.success('Pomyślnie dołączono do serwera!');
      onClose();
      reset();
    } catch (error: unknown) {
      setError((error as Error)?.message || 'Wystąpił błąd podczas dołączania do serwera.');
    }
  };

  const handleClose = () => {
    setError(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dołącz do serwera</DialogTitle>
          <DialogDescription>
            Wpisz nazwę serwera do którego chcesz dołączyć.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="grid gap-2 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name" className="text-right">
                Nazwa
              </Label>
              <Input
                id="name"
                {...register('name')}
                className="col-span-3"
                disabled={isSubmitting}
                placeholder="Nazwa serwera"
              />
            </div>
          {error && (
            <FormAlert type="error" message={error} small />
          )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleClose}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? 'Dołączanie...' : 'Dołącz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};