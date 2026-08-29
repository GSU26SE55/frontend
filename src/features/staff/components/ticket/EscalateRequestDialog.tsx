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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EscalationReasonEnum } from "@/shared/types/ticket/ticket.types";
import {
  escalateRequestSchema,
  type EscalateRequestFormValues,
} from "@/features/staff/schemas/ticket/staff-ticket.schema";

const ESCALATION_REASON_LABELS: Record<string, string> = {
  [EscalationReasonEnum.SkillGap]: "Exceeds technical capability",
  // PartsRequired is left out of the picker — the system has no warehouse/parts
  // inventory flow, so selecting it wouldn't lead to any further action.
  [EscalationReasonEnum.SafetyConcern]: "Safety concern",
  [EscalationReasonEnum.SlaBreach]: "SLA breached",
  [EscalationReasonEnum.CustomerComplaint]: "Customer complaint",
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Returns the mutation's promise so this dialog can map a rejection onto its
   *  own fields — a void callback leaves the error nowhere to go. */
  onSubmit: (data: EscalateRequestFormValues) => Promise<unknown>;
  isPending: boolean;
}

export function EscalateRequestDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const form = useForm<EscalateRequestFormValues>({
    resolver: zodResolver(escalateRequestSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // EntityError (400 + listErrors) → message lands on the field the BE rejected;
      // anything else → toast. The mutation no longer reports errors itself, precisely so
      // they can be mapped here.
      handleErrorApi({ error, setError: form.setError });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalation request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Escalation reason{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    items={Object.entries(ESCALATION_REASON_LABELS).map(
                      ([v, l]) => ({ value: v, label: l }),
                    )}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(ESCALATION_REASON_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the situation in more detail..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Sending..." : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
