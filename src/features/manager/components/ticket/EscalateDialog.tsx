import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  escalateApproveSchema,
  type EscalateApproveFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
// GH-1176: Manager approves Staff escalation request (Request→ReAssign).
import { useEscalateApproveTicket } from "@/features/manager/hooks/ticket/useManagerTickets";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function EscalateDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useEscalateApproveTicket(ticketId);

  const form = useForm<EscalateApproveFormValues>({
    resolver: zodResolver(escalateApproveSchema),
    defaultValues: { reason: "", keepCurrentPrimary: false },
  });

  const onSubmit = async (values: EscalateApproveFormValues) => {
    try {
      await mutateAsync(values);
      form.reset();
      onClose();
    } catch (error) {
      // EntityError (400 + listErrors) → the message lands on the offending input;
      // anything else → toast. Without this the promise rejected unhandled and the
      // dialog just sat there: no error shown, and reset/onClose never ran either.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve escalation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The escalation request will be approved and the ticket moved to
              reassignment.
            </p>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Decision reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter reason..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processing..." : "Approve escalation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
