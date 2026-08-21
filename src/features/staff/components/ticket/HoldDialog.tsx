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
import { DateTimePicker } from "@/shared/components/ui/DatePicker";
import { PauseReasonEnum } from "@/shared/types/ticket/ticket.types";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  holdSchema,
  type HoldFormValues,
} from "@/features/staff/schemas/ticket/staff-ticket.schema";

// GH-1176: new PauseReasonEnum values (CustomerUnavailable, WorkBlocked).
const PAUSE_REASON_LABELS: Record<PauseReasonEnum, string> = {
  [PauseReasonEnum.CustomerUnavailable]: "Customer unavailable",
  [PauseReasonEnum.WorkBlocked]: "Work blocked (parts / on-site schedule)",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: HoldFormValues) => Promise<unknown>;
  isPending: boolean;
}

export function HoldDialog({ open, onClose, onSubmit, isPending }: Props) {
  const form = useForm<HoldFormValues>({
    resolver: zodResolver(holdSchema),
    defaultValues: { rescheduledStartAt: "", note: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
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
              name="rescheduledStartAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Customer appointment{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      min={new Date()}
                      className="w-full"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    When the customer / blocker will be available. Work resumes
                    automatically at this time.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe why this ticket is on hold..."
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
