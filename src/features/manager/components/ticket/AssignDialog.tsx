import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isPast } from "date-fns";
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
  assignSchema,
  type AssignFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useAssignTicket } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
import StaffMultiSelect from "@/features/manager/components/ticket/StaffMultiSelect";
import { StaffSuggestionPanel } from "@/shared/components/ticket/StaffSuggestionPanel";
import { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";
import {
  getMinTierForPriority,
  getTierRequirementHint,
  isEligiblePrimaryHandler,
  staffOptionLabel,
} from "@/shared/utils/ticket/staffTier";

interface Props {
  ticketId: string;
  /** Ticket priority — determines the Primary Handler's minimum tier. */
  priority: TicketPriorityEnum | null;
  /** GH-1244: schedule selected by the Customer before Manager assignment. */
  scheduledStartAtUtc?: string | null;
  isPeriodicMaintenance?: boolean;
  open: boolean;
  onClose: () => void;
}

const formatLocalDatetime = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AssignDialog({
  ticketId,
  priority,
  scheduledStartAtUtc,
  isPeriodicMaintenance = false,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useAssignTicket(ticketId);
  const {
    data: staffList = [],
    isLoading: loadingStaff,
    isError: staffError,
  } = useStaffAssignmentList();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      primaryHandlerStaffId: "",
      priority: priority ?? TicketPriorityEnum.P2High,
      supporterStaffIds: [],
      scheduledStartAtUtc: formatLocalDatetime(),
      notes: "",
    },
  });

  const customerSchedule = useMemo(
    () =>
      isPeriodicMaintenance && scheduledStartAtUtc
        ? new Date(scheduledStartAtUtc)
        : null,
    [isPeriodicMaintenance, scheduledStartAtUtc],
  );
  const hasCustomerSchedule =
    customerSchedule !== null && !Number.isNaN(customerSchedule.getTime());
  const isCustomerScheduleExpired =
    hasCustomerSchedule && isPast(customerSchedule);
  const isCustomerScheduleActive =
    hasCustomerSchedule && !isCustomerScheduleExpired;

  useEffect(() => {
    if (open) {
      form.setValue(
        "scheduledStartAtUtc",
        isCustomerScheduleActive && customerSchedule
          ? formatLocalDatetime(customerSchedule)
          : formatLocalDatetime(),
      );
      form.setValue("notes", "");
      if (priority) {
        form.setValue("priority", priority);
      }
    }
  }, [
    open,
    priority,
    form,
    customerSchedule,
    isCustomerScheduleActive,
  ]);

  const selectedPriority =
    useWatch({
      control: form.control,
      name: "priority",
    }) ??
    priority ??
    TicketPriorityEnum.P2High;

  // Consistent with ReassignDialog: show ALL staff, disable those without enough tier
  // for Primary (Supporter doesn't check tier). Minimum tier follows the ticket priority.
  const minTier = getMinTierForPriority(selectedPriority);
  const tierHint = getTierRequirementHint(selectedPriority);
  const primaryOptions = staffList.map((s) => ({
    ...s,
    eligible: isEligiblePrimaryHandler(s.skillTier, minTier),
  }));
  const hasEligiblePrimary = primaryOptions.some((s) => s.eligible);

  const primaryStaffId = useWatch({
    control: form.control,
    name: "primaryHandlerStaffId",
  });

  const onSubmit = async (values: AssignFormValues) => {
    if (isCustomerScheduleExpired && !values.notes?.trim()) {
      form.setError("notes", {
        type: "manual",
        message:
          "Record how you contacted the Customer before replacing their expired schedule",
      });
      return;
    }

    try {
      // Preserve the exact Customer-selected instant (including seconds). Reformatting the
      // datetime-local value would truncate precision and the BE correctly rejects a mismatch.
      const isoDate =
        isCustomerScheduleActive && customerSchedule
          ? customerSchedule.toISOString()
          : values.scheduledStartAtUtc
            ? new Date(values.scheduledStartAtUtc).toISOString()
            : new Date().toISOString();
      await mutateAsync({
        ...values,
        scheduledStartAtUtc: isoDate,
      });
      form.reset();
      onClose();
    } catch {
      // Error handled by mutation onError (handleErrorApi)
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Suggestions placed RIGHT ABOVE the select: the Manager is at the exact decision
                point, so clicking "Pick" fills the field below directly. Putting it in a separate
                tab or sidebar would force them to remember the name and hunt for it in the list. */}
            <StaffSuggestionPanel
              ticketId={ticketId}
              selectedStaffId={primaryStaffId}
              onPick={(s) => {
                const matched = staffList.find(
                  (st) => st.accountId === s.staffId,
                );
                const targetId = matched?.accountId || s.staffId;
                form.setValue("primaryHandlerStaffId", targetId, {
                  shouldValidate: true,
                });
                form.setValue(
                  "supporterStaffIds",
                  form
                    .getValues("supporterStaffIds")
                    .filter((id) => id !== targetId),
                );
              }}
            />

            {/* No priority picker here: priority is derived from the Impact × Urgency matrix
                at triage and stays fixed for the ticket's lifetime, so assigning must not be a
                second chance to change it. The field itself stays in the form — the assign API
                requires a priority, and the tier gating below reads it from form state. */}

            <FormField
              control={form.control}
              name="primaryHandlerStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Primary Handler <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(v: string | null) => {
                      field.onChange(v ?? "");
                      // Primary cannot also be a Supporter (rejected by BE).
                      form.setValue(
                        "supporterStaffIds",
                        form
                          .getValues("supporterStaffIds")
                          .filter((id) => id !== v),
                      );
                    }}
                    value={field.value}
                    items={primaryOptions.map((s) => ({
                      value: s.accountId,
                      label: staffOptionLabel(s),
                    }))}
                    disabled={loadingStaff}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingStaff
                              ? "Loading..."
                              : staffError
                                ? "Failed to load list"
                                : "Select a staff member"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {staffError && (
                        <SelectItem value="_error" disabled>
                          Couldn't load the Staff list
                        </SelectItem>
                      )}
                      {!staffError && staffList.length === 0 && (
                        <SelectItem value="_empty" disabled>
                          No Staff available
                        </SelectItem>
                      )}
                      {primaryOptions.map((s) => (
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
                  {!loadingStaff && !staffError && !hasEligiblePrimary && (
                    <p className="text-xs text-destructive">
                      No Staff has a sufficient tier for this ticket. Raise a
                      Staff member's tier or transfer one from another group.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supporterStaffIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supporter</FormLabel>
                  <FormControl>
                    <StaffMultiSelect
                      options={staffList
                        .filter((s) => s.accountId !== primaryStaffId)
                        .map((s) => ({
                          value: s.accountId,
                          label: staffOptionLabel(s),
                        }))}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={loadingStaff || !!staffError}
                      placeholder={
                        loadingStaff ? "Loading..." : "Select supporting staff"
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Supporters get access to the ticket's internal chat but
                    aren't counted toward workload. This role doesn't require a
                    tier.
                  </p>
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
                    <Input
                      type="datetime-local"
                      disabled={isCustomerScheduleActive}
                      {...field}
                    />
                  </FormControl>
                  {isCustomerScheduleActive ? (
                    <p className="text-xs text-sky-700">
                      The Customer selected this schedule. It must be kept while
                      it is still valid.
                    </p>
                  ) : isCustomerScheduleExpired && customerSchedule ? (
                    <p className="text-xs text-amber-700">
                      The Customer schedule expired at{" "}
                      {customerSchedule.toLocaleString("vi-VN")}. Choose a new
                      time and record the Customer contact below.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Within the last 5 minutes → starts immediately
                      (InProgress). Future → Pending until due.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes
                    {isCustomerScheduleExpired && (
                      <span className="text-destructive"> *</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isCustomerScheduleExpired
                          ? "How and when was the Customer contacted?"
                          : "Notes for this assignment..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || loadingStaff || staffError}
              >
                {isPending ? "Processing..." : "Assign Staff"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
