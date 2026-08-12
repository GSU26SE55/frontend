// Sensor Readings — time-series data (TimescaleDB). Does NOT extend AuditableEntity.
// Docs: docs/api-battery.md §Group 4.
// Single source shared by admin/manager/staff (previously duplicated in each feature).

export interface SensorReadingDto {
  time: string; // ISO 8601 UTC — TimescaleDB partition key
  batteryAssetId: string;
  voltage: number; // V
  current: number; // A — negative = discharging
  temperature: number; // °C
  socPercent: number; // 0–100
  cycleCount: number | null; // null if the BMS does not report it
  sourceDeviceId: string | null;
}

export type SensorReadingSortKey =
  | "time"
  | "voltage"
  | "current"
  | "temperature"
  | "socPercent";

export interface SensorReadingHistoryParams {
  from?: string; // UTC
  to?: string; // UTC
  limit?: number; // 1–1000, default 100
  // timestamp of the last record on the previous page; the BE returns records
  // with time < cursor
  cursor?: string;
  // Server-side sort (Approach B): sortBy=time → normal cursor; any sortBy other
  // than time → from+to are REQUIRED, the BE sorts the whole [from,to] range,
  // nextCursor=null + hasMore=false.
  sortBy?: SensorReadingSortKey;
  sortDir?: string; // asc | desc (default desc)
}

// Cursor pagination — NO totalItems (time-series, a full count is too expensive)
export interface SensorReadingHistoryResponseDto {
  items: SensorReadingDto[]; // sorted by time descending
  nextCursor: string | null; // null when there is no more data
  hasMore: boolean;
}

export type SensorReadingInterval = "1m" | "5m" | "15m" | "1h" | "1d";

export interface SensorReadingAggregateParams {
  from?: string; // UTC
  to?: string; // UTC
  interval?: SensorReadingInterval; // default "1h"
}

// Fixed 1h buckets (TimescaleDB continuous aggregate) — for long ranges (months/years).
// Short ranges (≤ 7 days) with a flexible interval → use SensorReadingAggregateParams.
export interface SensorReadingAggregateHourlyParams {
  from?: string; // UTC
  to?: string; // UTC
}

// Shared by /aggregate and /aggregate/hourly — same shape.
// Charge/discharge min/max convention: ALWAYS returns a POSITIVE value for both
// directions (the direction is in the field name) → the FE never handles signs.
// null = the bucket has no sample in that direction.
export interface SensorReadingAggregateDto {
  time: string; // bucket start (UTC) — the field is "time", not "bucket"
  avgVoltage: number;
  avgCurrent: number;
  avgTemperature: number;
  avgSocPercent: number;
  avgSohPercent: number | null; // null if no reading in the bucket carries SOH
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
