import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { environmentalIncidentService } from "@/features/admin/services/environmental-incident.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  IncidentListParams,
  ResolveIncidentPayload,
  FalseAlarmIncidentPayload,
} from "@/shared/types/environmental.types";

export const useEnvironmentalIncidents = (params?: IncidentListParams) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.list(params),
    queryFn: () =>
      environmentalIncidentService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useEnvironmentalIncident = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.detail(id),
    queryFn: () =>
      environmentalIncidentService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useActiveIncidentsBySite = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.environmentalIncidents.activeBySite(siteId),
    queryFn: () =>
      environmentalIncidentService
        .getActiveBySite(siteId)
        .then((r) => r.data.data),
    enabled: !!siteId,
    staleTime: 30_000,
  });

export const useAcknowledgeIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => environmentalIncidentService.acknowledge(id),
    onSuccess: () => {
      toast.success("Đã acknowledge sự cố");
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useResolveIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResolveIncidentPayload;
    }) => environmentalIncidentService.resolve(id, data),
    onSuccess: () => {
      toast.success("Đã resolve sự cố");
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useMarkFalseAlarm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FalseAlarmIncidentPayload;
    }) => environmentalIncidentService.markFalseAlarm(id, data),
    onSuccess: () => {
      toast.success("Đã đánh dấu báo động nhầm");
      qc.invalidateQueries({ queryKey: [KEY.environmentalIncidents] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
