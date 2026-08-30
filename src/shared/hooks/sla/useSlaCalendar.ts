import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { slaCalendarService } from "@/shared/services/sla/sla-calendar.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  SlaNonWorkingPeriodParams,
  SlaNonWorkingPeriodPayload,
} from "@/shared/types/sla/sla-calendar.types";

export function useSlaNonWorkingPeriods(params?: SlaNonWorkingPeriodParams) {
  return useQuery({
    queryKey: QUERY_KEY.slaCalendar.list(params),
    queryFn: () => slaCalendarService.getList(params).then((r) => r.data.data),
  });
}

// Every mutation also invalidates tickets: the BE reconciles the deadline of every running
// SLA timer when the calendar changes (SlaDeadlineReconciler), so the due dates already on
// screen are stale the moment a period is saved.
const useCalendarMutation = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [KEY.slaCalendar] });
    qc.invalidateQueries({ queryKey: [KEY.tickets] });
  };
};

export function useCreateSlaNonWorkingPeriod() {
  const invalidate = useCalendarMutation();
  return useMutation({
    mutationFn: (payload: SlaNonWorkingPeriodPayload) =>
      slaCalendarService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Non-working period added");
    },
  });
}

export function useUpdateSlaNonWorkingPeriod() {
  const invalidate = useCalendarMutation();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SlaNonWorkingPeriodPayload;
    }) => slaCalendarService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Non-working period updated");
    },
  });
}

export function useDeleteSlaNonWorkingPeriod() {
  const invalidate = useCalendarMutation();
  return useMutation({
    mutationFn: (id: string) => slaCalendarService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Non-working period removed");
    },
    // Delete has no form to map field errors onto — surface it as a toast.
    onError: (error) => handleErrorApi({ error }),
  });
}
