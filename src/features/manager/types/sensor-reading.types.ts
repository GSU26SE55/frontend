// Sensor Readings — time-series data (TimescaleDB). Nhân bản tối thiểu từ
// features/admin/types/sensor-reading.types.ts vì manager không được import admin.

export interface SensorReadingDto {
  time: string; // ISO 8601 UTC
  batteryAssetId: string;
  voltage: number; // V
  current: number; // A — âm = đang xả
  temperature: number; // °C
  socPercent: number; // 0–100
  cycleCount: number | null;
  sourceDeviceId: string | null;
}

export interface SensorReadingHistoryParams {
  from?: string;
  to?: string;
  limit?: number; // 1–1000, default 100
  cursor?: string;
}

export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sort time giảm dần
  nextCursor: string | null;
  hasMore: boolean;
}
