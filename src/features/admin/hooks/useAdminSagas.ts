import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import { adminSagaService } from "../services/saga.service";
import type { AlertTicketSagaFilterParams } from "../types/saga.types";

export function useAlertTicketSagas(params?: AlertTicketSagaFilterParams) {
  return useQuery({
    queryKey: QUERY_KEY.admin.sagas.list(params),
    queryFn: () => adminSagaService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useAlertTicketSagaDetail(alertId: string) {
  return useQuery({
    queryKey: QUERY_KEY.admin.sagas.detail(alertId),
    queryFn: () => adminSagaService.getDetail(alertId).then((r) => r.data.data),
    enabled: !!alertId,
  });
}

export function useReprocessSaga() {
  const qc = useQueryClient();
  return useMutation({
    // Sinh Idempotency-Key mới mỗi lần bấm để chống double-trigger.
    mutationFn: (alertId: string) =>
      adminSagaService.reprocess(alertId, crypto.randomUUID()),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu xử lý lại saga");
      qc.invalidateQueries({ queryKey: KEY.admin.sagas });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
