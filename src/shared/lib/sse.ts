// SSE telemetry transport — kênh /api/sensor-readings/stream (text/event-stream).
// Native EventSource (KHÔNG thêm package). Token qua ?access_token= vì EventSource
// không set được header Authorization. Base = VITE_API_BASE_URL (gateway, giống axios) —
// KHÔNG dùng VITE_WS_URL (đó là origin hub SignalR, kênh khác).
//
// `openSse` là transport generic (forward raw event), không biết về shape payload →
// GH-116 reuse cho event `summary` (site scope). Parse shape nằm ở `parseReading`.

import { z } from "zod";
import Cookies from "js-cookie";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  LiveReadingDto,
  LiveStatsDto,
} from "@/shared/types/battery/sensor-stream.types";

// Zod cho payload `reading` (cả mỗi item của `summary` — cùng shape §5.3).
// non-null = required; nullable (bị lược khi null) = .nullish(); sourceType để z.number()
// (rộng) thay vì literal 1/2/3 → BE thêm giá trị mới không làm drop cả reading.
export const liveReadingSchema = z.object({
  batteryAssetId: z.string(),
  customerId: z.string(),
  time: z.string(),
  voltage: z.number(),
  current: z.number(),
  temperature: z.number(),
  socPercent: z.number(),
  sourceType: z.number(),
  siteId: z.string().nullish(),
  batteryTypeId: z.string().nullish(),
  sohPercent: z.number().nullish(),
  cycleCount: z.number().nullish(),
  chargingState: z.number().nullish(),
  internalResistanceMilliohm: z.number().nullish(),
  cellVoltageDeltaMv: z.number().nullish(),
  bmsErrorCode: z.string().nullish(),
  sourceDeviceId: z.string().nullish(),
  sensorSourceCode: z.string().nullish(),
});

// Parse defensive 1 reading từ raw SSE data string. Lệch shape / JSON hỏng → null (drop, không throw).
export function parseReading(data: string): LiveReadingDto | null {
  try {
    const parsed = liveReadingSchema.safeParse(JSON.parse(data));
    return parsed.success ? (parsed.data as LiveReadingDto) : null;
  } catch {
    return null;
  }
}

// Zod cho payload `stats` (§5.3bis) — rolling min/max nạp/xả theo window.
// min/max nullable (window chưa có mẫu chiều đó) → .nullish() vì null bị lược khỏi JSON.
export const liveStatsSchema = z.object({
  batteryAssetId: z.string(),
  customerId: z.string(),
  window: z.enum(["1h", "today"]),
  windowStart: z.string(),
  chargeSampleCount: z.number(),
  dischargeSampleCount: z.number(),
  updatedAt: z.string(),
  siteId: z.string().nullish(),
  maxChargeCurrent: z.number().nullish(),
  minChargeCurrent: z.number().nullish(),
  maxDischargeCurrent: z.number().nullish(),
  minDischargeCurrent: z.number().nullish(),
});

// Parse defensive 1 stats từ raw SSE data. Lệch shape / JSON hỏng → null (drop, không throw).
export function parseStats(data: string): LiveStatsDto | null {
  try {
    const parsed = liveStatsSchema.safeParse(JSON.parse(data));
    return parsed.success ? (parsed.data as LiveStatsDto) : null;
  } catch {
    return null;
  }
}

export interface SseHandlers {
  // event = "reading" | "summary" | "stats" | "ping"; data = raw JSON string (chưa parse).
  onEvent: (event: string, data: string) => void;
  onOpen?: () => void;
  onError?: (es: EventSource) => void;
}

// Mở SSE cho 1 scope (vd "asset:{id}" | "site:{id}"). Trả EventSource để caller .close().
export function openSse(scope: string, handlers: SseHandlers): EventSource {
  const token = Cookies.get("accessToken") ?? "";
  const url =
    `${env.VITE_API_BASE_URL}${ENDPOINTS.SENSOR_READINGS.STREAM}` +
    `?scope=${encodeURIComponent(scope)}&access_token=${encodeURIComponent(token)}`;

  const es = new EventSource(url);

  if (handlers.onOpen) {
    es.addEventListener("open", () => handlers.onOpen!());
  }
  const forward = (event: string) => (e: Event) =>
    handlers.onEvent(event, (e as MessageEvent).data);
  es.addEventListener("reading", forward("reading"));
  es.addEventListener("summary", forward("summary"));
  es.addEventListener("stats", forward("stats"));
  es.addEventListener("ping", forward("ping"));
  if (handlers.onError) {
    es.addEventListener("error", () => handlers.onError!(es));
  }

  return es;
}
