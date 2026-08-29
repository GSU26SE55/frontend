import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { useMergeTicket } from "@/features/admin/hooks/ticket/useAdminTickets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current ticket (will be merged into the target ticket). */
  ticketId: string;
  ticketCode: string;
  /** Suggested target ticket (from suspectedDuplicateOfTicketId) — pre-fill. */
  suggestedTargetId?: string | null;
}

// Manager merges THIS ticket (suspected duplicate) into the target ticket → this ticket closes.
export default function MergeTicketDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCode,
  suggestedTargetId,
}: Props) {
  // Init from prop (parent only mounts when opened via `open &&` condition → no effect needed;
  // eslint forbids setState-in-effect).
  const [targetId, setTargetId] = useState(suggestedTargetId ?? "");
  // Merging closes the source ticket permanently, so the click on "Merge ticket" only opens
  // this second confirmation — same guard the manager compare page uses.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const merge = useMergeTicket();

  const handleMerge = async () => {
    const trimmed = targetId.trim();
    if (!trimmed) return;
    try {
      await merge.mutateAsync({ id: ticketId, targetTicketId: trimmed });
      setConfirmOpen(false);
      onOpenChange(false);
    } catch {
      // Error already toasted in the hook's onError. Close the confirmation but keep the
      // form dialog open so the target id can be corrected and retried.
      setConfirmOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge duplicate ticket</DialogTitle>
          <DialogDescription>
            Ticket <strong>{ticketCode}</strong> will be merged (closed) into
            the target ticket. Only merge when certain both tickets are the same
            incident on the same battery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="merge-target">Target ticket ID (kept)</Label>
          <Input
            id="merge-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Enter target ticket ID..."
          />
          {suggestedTargetId && (
            <p className="text-xs text-muted-foreground">
              AI suggestion: pre-filled with the suspected duplicate ticket.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!targetId.trim() || merge.isPending}
          >
            {merge.isPending ? "Merging..." : "Merge ticket"}
          </Button>
        </DialogFooter>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm ticket merge?</AlertDialogTitle>
              <AlertDialogDescription>
                Ticket <strong>{ticketCode}</strong> will be{" "}
                <strong>closed permanently</strong> and merged into ticket{" "}
                <strong>{targetId.trim()}</strong>. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={merge.isPending}
                onClick={handleMerge}
              >
                {merge.isPending ? "Merging..." : "Merge ticket"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
