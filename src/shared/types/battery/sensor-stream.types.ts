// SSE telemetry live stream — payload of the `reading` event (channel /api/sensor-readings/stream).
// Source: frontend/docs/battery-realtime-description.md §5.3 (18 fields) + BE LiveReadingDto.cs.
// ⚠️ DIFFERENT from the REST `SensorReadingDto` (8 fields): REST is missing customerId·siteId·sohPercent·
//    chargingState·internalResistanceMilliohm·cellVoltageDeltaMv·bmsErrorCode·batteryTypeId·
//    sourceType·sensorSourceCode → do NOT share one type.
// ⚠️ Null fields are OMITTED from the SSE JSON → declare them optional and treat a missing field as null.

import type { SensorSourceTypeEnum } from "@/shared/enums/battery/telemetry.enum";
export {
  SensorSourceTypeEnum,
  SensorSourceCodeEnum,
} from "@/shared/enums/battery/telemetry.enum";

export interface LiveReadingDto {
  // non-null (always present)
  batteryAssetId: string; // GUID — routes to the right battery
  customerId: string; // GUID
  time: string; // ISO 8601 UTC
  voltage: number; // V
  current: number; // A — negative = discharging, positive = charging
  temperature: number; // °C
  socPercent: number; // %
  sourceType: SensorSourceTypeEnum; // 1=BMS, 2=IoTGateway, 3=External
  // nullable → omitted when null
  siteId?: string | null;
  batteryTypeId?: string | null;
  sohPercent?: number | null; // %
  cycleCount?: number | null;
  chargingState?: number | null; // raw int — map through ChargingStateEnum in the UI if needed
  internalResistanceMilliohm?: number | null; // mΩ
  cellVoltageDeltaMv?: number | null; // mV
  bmsErrorCode?: string | null;
  sourceDeviceId?: string | null;
  sensorSourceCode?: string | null; // known: SensorSourceCodeEnum (primary|redundant|external-temp)
}

// `stats` event payload — rolling charge/discharge current min/max per window, pushed on every scope.
// Source: docs/battery-realtime-description.md §5.3bis.
// ⚠️ Computed on `primary` readings only; samples with current == 0 (idle) are skipped.
// ⚠️ Null fields are OMITTED from the JSON (as in §5.3) → declare optional, a missing field = null.
export type StatsWindow = "1h" | "today";

export interface LiveStatsDto {
  // non-null (always present)
  batteryAssetId: string; // GUID
  customerId: string; // GUID
  window: StatsWindow; // current hour bucket (UTC) | since 00:00 UTC
  windowStart: string; // ISO 8601 UTC
  chargeSampleCount: number; // charge-direction samples accumulated in the window
  dischargeSampleCount: number;
  updatedAt: string; // ISO 8601 UTC
  // nullable → omitted when null (the window has no sample in that direction yet)
  siteId?: string | null; // null if the battery does not belong to a site
  maxChargeCurrent?: number | null; // A — ALWAYS positive
  minChargeCurrent?: number | null; // A — positive
  maxDischargeCurrent?: number | null; // A — ALWAYS positive: MAX(ABS(current)) where current < 0
  minDischargeCurrent?: number | null; // A — positive
}

// SSE connection state for one scope (the `reading` branch of scope asset:{id}).
// `stats` is independent of `reading` — one does not replace the other.
// ⚠️ The BE pushes BOTH windows ("1h" and "today") through the same `stats` event,
// differing only in the `window` field (RedisTelemetryStatsService: foreach window
// in StatsWindows.All) → key by window rather than storing one shared slot,
// otherwise the two windows overwrite each other.
export interface SensorStreamState {
  status: "connecting" | "open-idle" | "live" | "error" | "closed";
  reading?: LiveReadingDto;
  stats?: Partial<Record<StatsWindow, LiveStatsDto>>;
  lastPingAt?: number; // epoch ms of the most recent ping event
}
