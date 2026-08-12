import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingDto } from "@/shared/types/battery/sensor-reading-history.types";

// Evidence window: sensor log around the incident detection time (DetectedAt) ±minutes.
const EVIDENCE_WINDOW_MINUTES = 15;

/**
 * Sensor log around the incident detection time (DetectedAt ± 15') — serves as EVIDENCE
 * for the ticket, NOT the current real-time log. Only warning rows are shown in the component.
 * Query is disabled when assetId or detectedAt is missing (auto-generated tickets have no such timestamp).
 */
export function useReadingEvidence(
  assetId: string | null | undefined,
  detectedAt: string | null | undefined,
) {
  const from = detectedAt
    ? new Date(
        new Date(detectedAt).getTime() - EVIDENCE_WINDOW_MINUTES * 60_000,
      ).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(
        new Date(detectedAt).getTime() + EVIDENCE_WINDOW_MINUTES * 60_000,
      ).toISOString()
    : undefined;

  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId ?? "", {
      from,
      to,
      limit: 200,
    }),
    queryFn: () =>
      sensorReadingService
        .getHistory(assetId!, { from, to, limit: 200 })
        .then((r) => r.data.data),
    enabled: !!assetId && !!detectedAt,
  });
}

// Alert threshold — only uses signals that do NOT depend on pack voltage (the system has
// both 12V and 48V batteries → voltage thresholds can't be hardcoded). Consistent with AI verify:
// high temperature (safety) + low SOC (%). SOH is handled separately by AI verify (gRPC).
const TEMP_MAX = 45; // °C — overheating, a universal standard across battery types
const SOC_MIN = 15; // % — very low SOC

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // warning labels ("Overheating 47°C"...)
}

/** Filter readings with warnings + attach reason labels. No warning → not included as evidence. */
export function toWarningRows(readings: SensorReadingDto[]): ReadingWarning[] {
  const rows: ReadingWarning[] = [];
  for (const r of readings) {
    const reasons: string[] = [];
    if (r.temperature > TEMP_MAX)
      reasons.push(`Overheating ${r.temperature.toFixed(0)}°C`);
    if (r.socPercent < SOC_MIN)
      reasons.push(`Low SOC ${r.socPercent.toFixed(0)}%`);
    if (reasons.length > 0) rows.push({ reading: r, reasons });
  }
  return rows;
}
