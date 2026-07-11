import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ACTIONS } from "@/shared/constants/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

// Reusable confirm cho các action không có form: rotate/revoke key, delete device, publish/archive firmware.
export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  destructive,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "bg-destructive text-white hover:bg-destructive/90"
                : undefined
            }
            onClick={onConfirm}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
