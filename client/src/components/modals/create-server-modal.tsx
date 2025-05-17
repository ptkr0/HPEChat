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
});

type CreateServerValues = z.infer<typeof createServerSchema>;

interface CreateServerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateServerModal = ({ isOpen, onClose }: CreateServerModalProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<CreateServerValues>({
        resolver: zodResolver(createServerSchema),
        mode: 'onChange',
    });

    const createServer = useAppStore((state) => state.createServer);
    const selectServer = useAppStore((state) => state.selectServer);

    const submitHandler = async (data: CreateServerValues) => {
        try {
            const newServer = await createServer({
                name: data.name.trim(),
                description: data.description?.trim() || undefined,
            });

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
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Utwórz nowy serwer</DialogTitle>
                    <DialogDescription>
                        Jeden formularz dzieli cię od utworzenia nowego serwera.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
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
