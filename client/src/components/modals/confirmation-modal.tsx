import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAppStore } from "@/stores/appStore";

interface ConfirmationDialogProps {
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ConfirmationDialog({ channelId, isOpen, onClose }: ConfirmationDialogProps) {

    const deleteChannel = useAppStore((state) => state.deleteChannel);

    const handleDelete = async () => {
        try {
            await deleteChannel(channelId);
        } catch (err) {
            console.error("API error deleting channel:", err);
        }
        finally {
            onClose();
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Jesteś absolutnie pewny?</AlertDialogTitle>
                <AlertDialogDescription>
                Tej akcji nie można cofnąć. Wszystkie wysłane na tym kanale wiadomości oraz załączniki
                zostaną permanentnie usunięte z serwera.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onClose()}>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete()}>Kontynuuj</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
