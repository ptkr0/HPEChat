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
import { channelService } from "@/services/channelService";
import { toast } from "sonner";

interface DeleteChannelDialogProps {
  channelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteChannelDialog({ channelId, isOpen, onClose }: DeleteChannelDialogProps) {

  const handleDelete = async () => {
    try {
      await channelService.delete(channelId);
      toast.success("Kanał został pomyślnie usunięty.");
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
