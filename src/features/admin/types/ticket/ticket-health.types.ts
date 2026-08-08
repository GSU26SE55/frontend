// Health endpoints return RAW JSON (not wrapped in CommonResponse).

export interface TicketHealthDTO {
  status: string; // "Healthy"
  service: string;
  timestamp: string;
}

export interface SyncLagDTO {
  status: "Healthy" | "Warning" | string;
  customerLagSeconds: number;
  staffLagSeconds: number;
  maxLagSeconds: number;
  timestamp: string;
}

export interface SagaHealthDTO {
  status: "Healthy" | "Warning" | "Degraded" | string;
  failedLast24h: number;
  stuckOver15min: number;
  timestamp: string;
}
