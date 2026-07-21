// Contract khớp BE — AdminAlertTicketSagasController + AlertTicketSagaDTO.

export interface AlertTicketSagaDTO {
  correlationId: string;
  currentState: string;
  alertId: string;
  batteryAssetId?: string | null;
  customerId: string;
  assetSerialNumber?: string | null;
  anomalyType: number;
  severity: number;
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
  state?: string;
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
