import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  TicketHealthDTO,
  SyncLagDTO,
  SagaHealthDTO,
} from "@/features/admin/types/ticket/ticket-health.types";

// Lưu ý: các endpoint này trả JSON thuần → r.data CHÍNH LÀ DTO (không có .data.data).
export const ticketHealthService = {
  getHealth: () =>
    axiosInstance
      .get<TicketHealthDTO>(ENDPOINTS.TICKET_HEALTH.HEALTH)
      .then((r) => r.data),

  getSyncLag: () =>
    axiosInstance
      .get<SyncLagDTO>(ENDPOINTS.TICKET_HEALTH.SYNC_LAG)
      .then((r) => r.data),

  getSagaHealth: () =>
    axiosInstance
      .get<SagaHealthDTO>(ENDPOINTS.TICKET_HEALTH.SAGA)
      .then((r) => r.data),
};
