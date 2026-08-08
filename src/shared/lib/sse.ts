// SSE telemetry transport — channel /api/sensor-readings/stream (text/event-stream).
// Native EventSource (no extra package). Token via ?access_token= because EventSource
// can't set the Authorization header. Base = VITE_API_BASE_URL (gateway, same as axios) —
// does NOT use VITE_WS_URL (that's the SignalR hub origin, a different channel).
//
// `openSse` is a generic transport (forwards the raw event), unaware of the payload shape →
// GH-116 reuses it for the `summary` event (site scope). The parse shape lives in `parseReading`.

import { z } from "zod";
import Cookies from "js-cookie";
import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  LiveReadingDto,
  LiveStatsDto,
} from "@/shared/types/battery/sensor-stream.types";

// Zod schema for the `reading` payload (also each item of `summary` — same shape §5.3).
// non-null = required; nullable (omitted when null) = .nullish(); sourceType uses z.number()
// (broad) instead of literal 1/2/3 → the BE adding a new value won't drop the whole reading.
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

// Defensively parses a reading from a raw SSE data string. Shape mismatch / bad JSON → null (drop, don't throw).
export function parseReading(data: string): LiveReadingDto | null {
  try {
    const parsed = liveReadingSchema.safeParse(JSON.parse(data));
    return parsed.success ? (parsed.data as LiveReadingDto) : null;
  } catch {
    return null;
  }
}

// Zod schema for the `stats` payload (§5.3bis) — rolling min/max charge/discharge per window.
// min/max nullable (window has no sample in that direction yet) → .nullish() since null is omitted from JSON.
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

// Defensively parses stats from raw SSE data. Shape mismatch / bad JSON → null (drop, don't throw).
export function parseStats(data: string): LiveStatsDto | null {
  try {
    const parsed = liveStatsSchema.safeParse(JSON.parse(data));
    return parsed.success ? (parsed.data as LiveStatsDto) : null;
  } catch {
    return null;
  }
}

export interface SseHandlers {
  // event = "reading" | "summary" | "stats" | "ping"; data = raw JSON string (unparsed).
  onEvent: (event: string, data: string) => void;
  onOpen?: () => void;
  onError?: (es: EventSource) => void;
}

// Opens an SSE connection for a scope (e.g. "asset:{id}" | "site:{id}"). Returns the EventSource for the caller to .close().
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
