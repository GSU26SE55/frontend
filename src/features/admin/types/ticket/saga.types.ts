// Contract khớp BE — AdminAlertTicketSagasController + AlertTicketSagaDTO.
import type {
  AlertSeverityEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";
import type { SagaStateEnum } from "@/features/admin/enums/saga.enum";

export { SagaStateEnum } from "@/features/admin/enums/saga.enum";

export interface AlertTicketSagaDTO {
  correlationId: string;
  // MassTransit trả state dạng string-name; giữ `string` để state mới từ BE không vỡ type.
  currentState: SagaStateEnum | string;
  alertId: string;
  batteryAssetId?: string | null;
  customerId: string;
  assetSerialNumber?: string | null;
  // BE gửi số (AnomalyTypeEnum / AlertSeverityEnum trong BatteryService.Domain).
  anomalyType: AnomalyTypeEnum;
  severity: AlertSeverityEnum;
  ticketId?: string | null;
  ticketCode?: string | null;
  ticketIsReused: boolean;
  failedAtStage?: string | null;
  failureReason?: string | null;
  failureErrorCode?: string | null;
  failedAt?: string | null;
  retryCount: number;
  startedAt: string;
  completedAt?: string | null;
}

export interface AlertTicketSagaFilterParams {
  state?: SagaStateEnum;
  alertId?: string;
  batteryAssetId?: string;
  customerId?: string;
  startedFrom?: string;
  startedTo?: string;
  isFailed?: boolean;
  pageNumber?: number;
  pageSize?: number;
  isDescending?: boolean;
}

// data trả về của POST reprocess (202).
export interface SagaReprocessResult {
  alertId: string;
  performedBy?: string | null;
}
