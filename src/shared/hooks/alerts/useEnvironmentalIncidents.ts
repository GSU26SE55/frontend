import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { environmentalService } from "@/shared/services/alerts/environmental.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  IncidentListParams,
  ManualIncidentPayload,
  ResolveIncidentPayload,
  FalseAlarmIncidentPayload,
} from "@/shared/types/alerts/environmental.types";
import { MESSAGES } from "@/shared/constants/messages";

// Incident list — site safety, near-realtime: staleTime 30s + poll 30s.
export const useIncidentList = (params?: IncidentListParams) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.list(params),
    queryFn: () =>
      environmentalService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

export const useIncidentDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.detail(id),
    queryFn: () => environmentalService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

// Active incidents by site — dashboard widget: staleTime 0 + poll 30s.
export const useActiveIncidentsBySite = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.activeBySite(siteId),
    queryFn: () =>
      environmentalService.getActiveBySite(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    staleTime: 0,
    refetchInterval: 30_000,
  });

// Manual report — form mutation: component handles the error via try-catch +
// handleErrorApi({error,setError}). BE distinguishes by HTTP status:
// 201 = newly created · 200 = dedup, returns the existing active incident (no re-emitted event).
export const useReportManualIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualIncidentPayload) =>
      environmentalService.reportManual(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
      toast.success(
        res.status === 201
          ? MESSAGES.incident.reported
          : MESSAGES.incident.alreadyActive,
      );
    },
  });
};

// Acknowledge — non-form action: error toast directly via onError.
export const useAcknowledgeIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => environmentalService.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
      toast.success(MESSAGES.incident.acknowledged);
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// Resolve — form mutation: component handles the error via try-catch + handleErrorApi({error,setError}).
export const useResolveIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ResolveIncidentPayload;
    }) => environmentalService.resolve(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
      toast.success(MESSAGES.incident.resolved);
    },
  });
};

// False alarm — form mutation: component handles the error via try-catch + handleErrorApi({error,setError}).
export const useFalseAlarmIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: FalseAlarmIncidentPayload;
    }) => environmentalService.falseAlarm(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
      toast.success(MESSAGES.incident.falseAlarm);
    },
  });
};
