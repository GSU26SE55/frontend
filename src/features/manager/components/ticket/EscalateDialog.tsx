import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  escalateSchema,
  type EscalateFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { EscalationReasonEnum } from "@/shared/types/ticket/ticket.types";
import { useEscalateTicket } from "@/features/manager/hooks/ticket/useManagerTickets";

const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Exceeds technical capability",
  PartsRequired: "Requires unavailable parts",
  SafetyConcern: "Safety concern",
  SlaBreach: "SLA breached",
  CustomerComplaint: "Customer complaint",
};

// Options offered to the user — PartsRequired is excluded since the system has no
// warehouse flow. The label above is kept so older tickets that stored this value
// still display the correct text.
const REASON_OPTIONS = (
  Object.values(EscalationReasonEnum) as EscalationReasonEnum[]
).filter((v) => v !== EscalationReasonEnum.PartsRequired);

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function EscalateDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useEscalateTicket(ticketId);

  const form = useForm<EscalateFormValues>({
    resolver: zodResolver(escalateSchema),
    defaultValues: { reason: undefined, note: "" },
  });

  const onSubmit = async (values: EscalateFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escalate</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escalation reason *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={REASON_OPTIONS.map((v) => ({
                      value: v,
                      label: ESCALATION_REASON_LABEL[v],
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {REASON_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {ESCALATION_REASON_LABEL[v]}
                        </SelectItem>
                      ))}
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
                  <FormLabel>Additional notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes..." {...field} />
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
                {isPending ? "Processing..." : "Escalate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
