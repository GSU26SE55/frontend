// Sensor Readings — time-series data (TimescaleDB). KHÔNG extend AuditableEntity.
// Docs: docs/api-battery.md §Nhóm 4.

export interface SensorReadingDto {
  time: string; // ISO 8601 UTC — partition key TimescaleDB
  batteryAssetId: string;
  voltage: number; // V
  current: number; // A — âm = đang xả
  temperature: number; // °C
  socPercent: number; // 0–100
  cycleCount: number | null; // null nếu BMS không report
  sourceDeviceId: string | null;
}

export interface SensorReadingHistoryParams {
  from?: string; // UTC
  to?: string; // UTC
  limit?: number; // 1–1000, default 100
  cursor?: string; // timestamp record cuối trang trước; BE lấy record có time < cursor
}

// Cursor pagination — KHÔNG có totalItems (time-series, count full quá tốn)
export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sort time giảm dần
  nextCursor: string | null; // null nếu hết data
  hasMore: boolean;
}

export type SensorReadingInterval = "1m" | "5m" | "15m" | "1h" | "1d";

export interface SensorReadingAggregateParams {
  from?: string; // UTC
  to?: string; // UTC
  interval?: SensorReadingInterval; // default "1h"
}

// Bucket 1h cố định (TimescaleDB continuous aggregate) — dùng cho range dài (tháng/năm).
// Range ngắn (≤ 7 ngày) + interval linh hoạt → dùng SensorReadingAggregateParams.
export interface SensorReadingAggregateHourlyParams {
  from?: string; // UTC
  to?: string; // UTC
}

// Dùng chung cho /aggregate và /aggregate/hourly — cùng shape.
// Quy ước min/max nạp/xả: LUÔN trả giá trị DƯƠNG cho cả 2 chiều (chiều nằm trong tên
// field) → FE không xử lý dấu. null = bucket chưa có mẫu chiều đó.
export interface SensorReadingAggregateDto {
  time: string; // điểm bắt đầu bucket (UTC) — field "time", không phải "bucket"
  avgVoltage: number;
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null; // null nếu bucket không có reading nào có SOH
  minVoltage: number | null;
  maxVoltage: number | null;
  minTemperature: number | null;
  maxTemperature: number | null;
  maxChargeCurrent: number | null;
  minChargeCurrent: number | null;
  avgChargeCurrent: number | null;
  maxDischargeCurrent: number | null;
  minDischargeCurrent: number | null;
  avgDischargeCurrent: number | null;
  chargeSampleCount: number;
  dischargeSampleCount: number;
}
