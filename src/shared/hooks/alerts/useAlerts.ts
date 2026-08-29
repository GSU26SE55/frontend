import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alertService } from "@/shared/services/alerts/alert.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AlertListParams } from "@/shared/types/alerts/alert.types";
import { AlertStatusEnum } from "@/shared/enums/alerts/alert.enum";
import { MESSAGES } from "@/shared/constants/messages";

// Alert queue — near-realtime: staleTime 30s + poll 30s (per the cache table in fe.md)
export const useAlertList = (params?: AlertListParams) =>
  useQuery({
    queryKey: QUERY_KEY.alerts.list(params),
    queryFn: () => alertService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const useAlertDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.alerts.detail(id),
    queryFn: () => alertService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAcknowledgeAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.alerts] });
      toast.success(MESSAGES.alert.acknowledged);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useResolveAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.alerts] });
      toast.success(MESSAGES.alert.resolved);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

import type { SubmitPrescriptionFeedbackCommand } from "@/shared/types/alerts/alert.types";

export const useRegenerateAiPrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentic }: { id: string; agentic?: boolean }) =>
      alertService.regenerateAiPrescription(id, agentic),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.alerts.detail(id) });
      toast.success("AI prescription regenerated successfully");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useSubmitPrescriptionFeedback = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      command,
    }: {
      id: string;
      command: SubmitPrescriptionFeedbackCommand;
    }) => alertService.submitPrescriptionFeedback(id, command),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.alerts.detail(id) });
      toast.success("AI prescription feedback submitted successfully");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// Unresolved count for the summary strip. Open and Acknowledged both still need someone
// to act, so each gets its own query and the caller sums them — the BE list endpoint takes
// a single status, not a set. pageSize 1 keeps the payload to one row: only `totalItems`
// is read. Counting the loaded page instead would be wrong — that only sees one page.
export const useUnresolvedAlertCount = () => {
  const open = useAlertList({
    pageNumber: 1,
    pageSize: 1,
    status: AlertStatusEnum.Open,
    excludeEnvironmentalIncidents: true,
    excludeIotDeviceAlerts: true,
  });
  const acknowledged = useAlertList({
    pageNumber: 1,
    pageSize: 1,
    status: AlertStatusEnum.Acknowledged,
    excludeEnvironmentalIncidents: true,
    excludeIotDeviceAlerts: true,
  });

  return {
    count: (open.data?.totalItems ?? 0) + (acknowledged.data?.totalItems ?? 0),
    isLoading: open.isLoading || acknowledged.isLoading,
  };
};

// Same shape as useUnresolvedAlertCount, for the Device alerts badge. The two filters are
// exact opposites, so a device alert is counted by this badge and not by the battery one —
// no alert is counted twice and none is missed.
export const useUnresolvedDeviceAlertCount = () => {
  const open = useAlertList({
    pageNumber: 1,
    pageSize: 1,
    status: AlertStatusEnum.Open,
    iotOnly: true,
  });
  const acknowledged = useAlertList({
    pageNumber: 1,
    pageSize: 1,
    status: AlertStatusEnum.Acknowledged,
    iotOnly: true,
  });

  return {
    count: (open.data?.totalItems ?? 0) + (acknowledged.data?.totalItems ?? 0),
    isLoading: open.isLoading || acknowledged.isLoading,
  };
};
