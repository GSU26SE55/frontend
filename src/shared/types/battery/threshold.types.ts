// ThresholdConfig — ngưỡng cảnh báo theo BatteryType. Read dùng chung admin/manager
// (tô màu telemetry). Upsert payload chỉ admin dùng nhưng giữ chung 1 file type.
export interface ThresholdConfigDto {
  id: string;
  batteryTypeId: string;
  batteryTypeName: string;
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  currentMaxCharge?: number;
  currentMaxDischarge?: number;
  sohWarningThreshold?: number;
  sohCriticalThreshold?: number;
  effectiveFromUtc: string;
  isActive: boolean;
}

export interface ThresholdListParams {
  pageNumber?: number;
  pageSize?: number;
  batteryTypeId?: string;
  isActive?: boolean;
}

export interface ThresholdByTypeParams {
  includeInactive?: boolean;
}

export interface UpsertThresholdPayload {
  voltageMin: number;
  voltageMax: number;
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  socCriticalThreshold: number;
  currentMaxCharge?: number;
  currentMaxDischarge?: number;
  sohWarningThreshold?: number;
  sohCriticalThreshold?: number;
  effectiveFromUtc?: string;
}
