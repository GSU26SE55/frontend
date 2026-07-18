// SSE telemetry live stream — payload của event `reading` (kênh /api/sensor-readings/stream).
// Nguồn: frontend/docs/battery-realtime-description.md §5.3 (18 field) + BE LiveReadingDto.cs.
// ⚠️ KHÁC REST `SensorReadingDto` (8 field): REST thiếu customerId·siteId·sohPercent·
//    chargingState·internalResistanceMilliohm·cellVoltageDeltaMv·bmsErrorCode·batteryTypeId·
//    sourceType·sensorSourceCode → KHÔNG dùng chung 1 type.
// ⚠️ Field null bị LƯỢC khỏi JSON SSE → khai optional, coi field vắng = null.

import type { SensorSourceTypeEnum } from "@/shared/enums/telemetry.enum";
export {
  SensorSourceTypeEnum,
  SensorSourceCodeEnum,
} from "@/shared/enums/telemetry.enum";

export interface LiveReadingDto {
  // non-null (luôn có mặt)
  batteryAssetId: string; // GUID — route đúng pin
  customerId: string; // GUID
  time: string; // ISO 8601 UTC
  voltage: number; // V
  current: number; // A — âm = xả, dương = sạc
  temperature: number; // °C
  socPercent: number; // %
  sourceType: SensorSourceTypeEnum; // 1=BMS, 2=IoTGateway, 3=External
  // nullable → bị lược khi null
  siteId?: string | null;
  batteryTypeId?: string | null;
  sohPercent?: number | null; // %
  cycleCount?: number | null;
  chargingState?: number | null; // raw int — map qua ChargingStateEnum ở UI nếu cần
  internalResistanceMilliohm?: number | null; // mΩ
  cellVoltageDeltaMv?: number | null; // mV
  bmsErrorCode?: string | null;
  sourceDeviceId?: string | null;
  sensorSourceCode?: string | null; // known: SensorSourceCodeEnum (primary|redundant|external-temp)
}

// Payload event `stats` — rolling min/max dòng nạp/xả theo window, đẩy trên mọi scope.
// Nguồn: docs/battery-realtime-description.md §5.3bis.
// ⚠️ Chỉ tính trên reading `primary`; sample current == 0 (idle) bị bỏ qua.
// ⚠️ Field null bị LƯỢC khỏi JSON (như §5.3) → khai optional, field vắng = null.
export type StatsWindow = "1h" | "today";

export interface LiveStatsDto {
  // non-null (luôn có mặt)
  batteryAssetId: string; // GUID
  customerId: string; // GUID
  window: StatsWindow; // bucket giờ hiện tại (UTC) | từ 00:00 UTC
  windowStart: string; // ISO 8601 UTC
  chargeSampleCount: number; // số mẫu chiều nạp tích lũy trong window
  dischargeSampleCount: number;
  updatedAt: string; // ISO 8601 UTC
  // nullable → bị lược khi null (window chưa có mẫu chiều đó)
  siteId?: string | null; // null nếu pin không thuộc site
  maxChargeCurrent?: number | null; // A — LUÔN dương
  minChargeCurrent?: number | null; // A — dương
  maxDischargeCurrent?: number | null; // A — LUÔN dương: MAX(ABS(current)) với current < 0
  minDischargeCurrent?: number | null; // A — dương
}

// Trạng thái kết nối SSE cho 1 scope (nhánh `reading` của scope asset:{id}).
// `stats` độc lập với `reading` — không thay thế nhau.
// ⚠️ BE đẩy CẢ 2 window ("1h" và "today") qua cùng event `stats`, chỉ khác field
// `window` (RedisTelemetryStatsService: foreach window in StatsWindows.All) → phải
// key theo window, không lưu 1 slot chung (nếu không 2 window ghi đè lẫn nhau).
export interface SensorStreamState {
  status: "connecting" | "open-idle" | "live" | "error" | "closed";
  reading?: LiveReadingDto;
  stats?: Partial<Record<StatsWindow, LiveStatsDto>>;
  lastPingAt?: number; // epoch ms của event ping gần nhất
}
