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
import { PauseReasonEnum } from "@/shared/types/ticket/ticket.types";
import {
  holdSchema,
  type HoldFormValues,
} from "@/features/staff/schemas/ticket/staff-ticket.schema";

// Only "waiting for parts" remains — the other two reasons (waiting on customer,
// waiting for on-site appointment) were removed from the hold flow. PauseReasonEnum
// still keeps all 3 values so older tickets in WaitingCustomer/WaitingOnsiteSchedule
// can still be read; only new selections are blocked.
const PAUSE_REASON_LABELS: Record<string, string> = {
  [PauseReasonEnum.WaitingParts]: "Waiting for parts",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: HoldFormValues) => void;
  isPending: boolean;
}

export function HoldDialog({ open, onClose, onSubmit, isPending }: Props) {
  const form = useForm<HoldFormValues>({
    resolver: zodResolver(holdSchema),
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Put on hold</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Hold reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    items={Object.entries(PAUSE_REASON_LABELS).map(
                      ([v, l]) => ({ value: v, label: l }),
                    )}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(PAUSE_REASON_LABELS).map(
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
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more detail if needed..."
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processing..." : "Put on hold"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
