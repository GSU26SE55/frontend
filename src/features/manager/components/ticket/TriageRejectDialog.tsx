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
  triageRejectSchema,
  type TriageRejectFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useTriageRejectTicket } from "@/features/manager/hooks/ticket/useManagerTickets";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function TriageRejectDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useTriageRejectTicket(ticketId);

  const form = useForm<TriageRejectFormValues>({
    resolver: zodResolver(triageRejectSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = async (values: TriageRejectFormValues) => {
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
          <DialogTitle>Reject ticket (Triage)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The ticket will move to <strong>Closed (Rejected)</strong> — use
              this when the ticket is invalid (spam, duplicate, out of service
              scope).
            </p>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Rejection reason <span className="text-destructive">*</span>
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
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Processing..." : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
