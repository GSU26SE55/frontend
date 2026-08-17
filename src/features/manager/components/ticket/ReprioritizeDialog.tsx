import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { handleErrorApi } from "@/shared/lib/errors";
import {
  reprioritizeSchema,
  type ReprioritizeFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import {
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketPriorityEnum,
} from "@/shared/types/ticket/ticket.types";
import { useReprioritizeTicket } from "@/features/manager/hooks/ticket/useManagerTickets";
import { computePriority } from "@/shared/utils/ticket/priorityMatrix";

const PRIORITY_LABEL: Record<TicketPriorityEnum, string> = {
  [TicketPriorityEnum.P1Critical]: "P1 — Critical (SLA 4h)",
  [TicketPriorityEnum.P2High]: "P2 — High (SLA 24h)",
  [TicketPriorityEnum.P3Normal]: "P3 — Standard (SLA 72h)",
  [TicketPriorityEnum.Urgent]: "Urgent — SLA timer stopped",
};

const IMPACT_LABEL: Record<ImpactScopeEnum, string> = {
  SingleAsset: "Single Asset — one battery only",
  Site: "Site — an entire site",
  MultiSite: "Multi Site — multiple sites",
};

const URGENCY_LABEL: Record<UrgencyLevelEnum, string> = {
  Low: "Low — handle on regular schedule",
  Medium: "Medium — needs prompt handling",
  High: "High — needs immediate handling",
};

interface Props {
  ticketId: string;
  /** Current Impact/Urgency — preselected so the Manager sees what they're editing from. */
  currentImpact?: ImpactScopeEnum | null;
  currentUrgency?: UrgencyLevelEnum | null;
  open: boolean;
  onClose: () => void;
}

export default function ReprioritizeDialog({
  ticketId,
  currentImpact,
  currentUrgency,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useReprioritizeTicket(ticketId);

  const form = useForm<ReprioritizeFormValues>({
    resolver: zodResolver(reprioritizeSchema),
    defaultValues: {
      impact: currentImpact ?? undefined,
      urgency: currentUrgency ?? undefined,
      reason: "",
    },
  });

  // Preview the priority as soon as both fields are selected — the BE is still the
  // source of truth for the actual computation. useWatch replaces form.watch(): watch()
  // returns a function that can't be memoized, so the React Compiler skips optimizing
  // the whole component.
  const impact = useWatch({ control: form.control, name: "impact" });
  const urgency = useWatch({ control: form.control, name: "urgency" });
  const computed = computePriority(impact, urgency);

  const onSubmit = async (values: ReprioritizeFormValues) => {
    try {
      await mutateAsync(values);
      form.reset();
      onClose();
    } catch (error) {
      // EntityError (400 + listErrors) → error shows under the right input; HttpError
      // (404/409) → toast. Don't let the hook handle this automatically: handleErrorApi
      // without setError silently swallows EntityError, leaving the user's bad submit
      // with no visible feedback.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change priority</DialogTitle>
          <DialogDescription>
            Priority is computed from impact scope and urgency level. It can
            only be changed while the ticket hasn't been assigned to a staff
            member — once assigned, use escalation to add resources instead.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Impact scope <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.values(ImpactScopeEnum).map((v) => ({
                      value: v,
                      label: IMPACT_LABEL[v],
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select impact scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.values(ImpactScopeEnum).map((v) => (
                        <SelectItem key={v} value={v}>
                          {IMPACT_LABEL[v]}
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
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Urgency level <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.values(UrgencyLevelEnum).map((v) => ({
                      value: v,
                      label: URGENCY_LABEL[v],
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.values(UrgencyLevelEnum).map((v) => (
                        <SelectItem key={v} value={v}>
                          {URGENCY_LABEL[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {computed && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                Computed priority: <strong>{PRIORITY_LABEL[computed]}</strong>
              </p>
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason for change{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why the priority needs to change..."
                      maxLength={1000}
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Processing..." : "Change priority"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
