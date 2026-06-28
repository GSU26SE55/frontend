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

// Trạng thái kết nối SSE cho 1 scope (issue này chỉ nhánh `reading` của scope asset:{id}).
export interface SensorStreamState {
  status: "connecting" | "open-idle" | "live" | "error" | "closed";
  reading?: LiveReadingDto;
  lastPingAt?: number; // epoch ms của event ping gần nhất
}
