import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alertService } from "@/features/admin/services/alert.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AlertListParams } from "@/shared/types/alert.types";
import { MESSAGES } from "@/shared/constants/messages";

export const useAdminAlerts = (params?: AlertListParams) =>
  useQuery({
    queryKey: QUERY_KEY.alerts.list(params),
    queryFn: () => alertService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useAdminAlert = (id: string) =>
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
      toast.success(MESSAGES.alert.acknowledged);
      qc.invalidateQueries({ queryKey: [KEY.alerts] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useResolveAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.resolve(id),
    onSuccess: () => {
      toast.success(MESSAGES.alert.resolved);
      qc.invalidateQueries({ queryKey: [KEY.alerts] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
