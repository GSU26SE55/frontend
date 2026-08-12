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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  reassignSchema,
  type ReassignFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useReassignTicket } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";
import {
  getMinTierForPriority,
  getTierRequirementHint,
  isEligiblePrimaryHandler,
  staffOptionLabel,
} from "@/shared/utils/ticket/staffTier";

interface Props {
  ticketId: string;
  /** Ticket priority — determines the new Primary Handler's minimum tier. */
  priority: TicketPriorityEnum | null;
  open: boolean;
  onClose: () => void;
}

export default function ReassignDialog({
  ticketId,
  priority,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useReassignTicket(ticketId);
  const { data: staffList = [], isLoading: loadingStaff } =
    useStaffAssignmentList();

  const minTier = getMinTierForPriority(priority);
  const tierHint = getTierRequirementHint(priority);
  const staffOptions = staffList.map((s) => ({
    ...s,
    eligible: isEligiblePrimaryHandler(s.skillTier, minTier),
  }));
  const hasEligibleStaff = staffOptions.some((s) => s.eligible);

  const form = useForm<ReassignFormValues>({
    resolver: zodResolver(reassignSchema),
    defaultValues: {
      newPrimaryHandlerStaffId: "",
      reason: "",
      scheduledStartAtUtc: "",
    },
  });

  const onSubmit = async (values: ReassignFormValues) => {
    await mutateAsync({ ...values, scheduledStartAtUtc: new Date(values.scheduledStartAtUtc).toISOString() });
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Staff</DialogTitle>
          <p className="text-xs text-muted-foreground">
            The current Primary Handler will become a Supporter. The SLA is not
            reset.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPrimaryHandlerStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Primary Handler *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={staffOptions.map((s) => ({
                      value: s.accountId,
                      label: staffOptionLabel(s),
                    }))}
                    disabled={loadingStaff}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingStaff
                              ? "Loading..."
                              : "Select a staff member"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {staffList.length === 0 && (
                        <SelectItem value="_empty" disabled>
                          No Staff available
                        </SelectItem>
                      )}
                      {staffOptions.map((s) => (
                        <SelectItem
                          key={s.accountId}
                          value={s.accountId}
                          disabled={!s.eligible}
                        >
                          {staffOptionLabel(s)}
                          {!s.eligible && " — tier not sufficient"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tierHint && (
                    <p className="text-xs text-muted-foreground">{tierHint}</p>
                  )}
                  {!loadingStaff &&
                    !hasEligibleStaff &&
                    staffList.length > 0 && (
                      <p className="text-xs text-destructive">
                        No Staff has a sufficient tier for this ticket.
                      </p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledStartAtUtc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Start schedule <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Within the last 5 minutes → starts immediately (InProgress).
                    Future → Pending until due.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reassignment reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Reason..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || loadingStaff}>
                {isPending ? "Processing..." : "Reassign"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
