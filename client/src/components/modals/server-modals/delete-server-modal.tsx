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
import { serverService } from "@/services/serverService";
import { toast } from "sonner";

interface DeleteServerDialogProps {
  serverId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteServerDialog({ serverId, isOpen, onClose }: DeleteServerDialogProps) {

  const handleDelete = async () => {
    try {
      await serverService.delete(serverId);
      toast.success("Serwer został pomyślnie usunięty.");
    } catch (err) {
      console.error("API error deleting server:", err);
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
            Tej akcji nie można cofnąć. Zostaną usunięte wszystkie kanały, wiadomości oraz załączniki.
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
