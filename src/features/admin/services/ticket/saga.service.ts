import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  AlertTicketSagaDTO,
  AlertTicketSagaFilterParams,
  SagaReprocessResult,
} from "@/features/admin/types/ticket/saga.types";

function toQuery(params?: AlertTicketSagaFilterParams) {
  if (!params) return undefined;
  return {
    State: params.state,
    AlertId: params.alertId,
    BatteryAssetId: params.batteryAssetId,
    CustomerId: params.customerId,
    StartedFrom: params.startedFrom,
    StartedTo: params.startedTo,
    IsFailed: params.isFailed,
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
    IsDescending: params.isDescending,
  };
}

export const adminSagaService = {
  getList: (params?: AlertTicketSagaFilterParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<AlertTicketSagaDTO>>>(
      ENDPOINTS.ADMIN.SAGAS.ALERT_TICKET_LIST,
      { params: toQuery(params) },
    ),

  getDetail: (alertId: string) =>
    axiosInstance.get<CommonResponse<AlertTicketSagaDTO>>(
      ENDPOINTS.ADMIN.SAGAS.ALERT_TICKET_DETAIL(alertId),
    ),

  // POST reprocess — Admin only. Idempotency-Key header is required (prevents double-trigger).
  reprocess: (alertId: string, idempotencyKey: string) =>
    axiosInstance.post<CommonResponse<SagaReprocessResult>>(
      ENDPOINTS.ADMIN.SAGAS.ALERT_TICKET_REPROCESS(alertId),
      null,
      { headers: { "Idempotency-Key": idempotencyKey } },
    ),
};
