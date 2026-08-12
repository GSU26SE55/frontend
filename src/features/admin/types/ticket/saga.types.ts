// Contract matching BE — AdminAlertTicketSagasController + AlertTicketSagaDTO.
import type {
  AlertSeverityEnum,
  AnomalyTypeEnum,
} from "@/shared/enums/alerts/alert.enum";
import type { SagaStateEnum } from "@/features/admin/enums/saga.enum";

export { SagaStateEnum } from "@/features/admin/enums/saga.enum";

export interface AlertTicketSagaDTO {
  correlationId: string;
  // MassTransit returns state as a string name; kept as `string` so new states from BE don't break the type.
  currentState: SagaStateEnum | string;
  alertId: string;
  batteryAssetId?: string | null;
  customerId: string;
  assetSerialNumber?: string | null;
  // BE sends a number (AnomalyTypeEnum / AlertSeverityEnum in BatteryService.Domain).
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

// data returned by POST reprocess (202).
export interface SagaReprocessResult {
  alertId: string;
  performedBy?: string | null;
}
