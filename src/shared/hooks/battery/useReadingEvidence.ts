import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingDto } from "@/shared/types/battery/sensor-reading-history.types";

/**
 * How wide to look around `detectedAt` — and it depends on WHO produced that timestamp.
 *
 * `AutoFromAlert`: the scanner stamps the alert with the reading's own `Time`, so the two
 * match to the millisecond. Seconds is the right granularity, and it has to stay tight: a
 * ±15' window swept in readings from *other* cases run minutes earlier on the same battery,
 * and an Undertemp ticket ended up displaying the 72°C row belonging to an Overheat ticket.
 *
 * `ManualByCustomer` / `CreatedByStaff`: a person typed in when they noticed the problem.
 * Nobody recalls an incident to the second — they enter "3pm" for something seen around 3pm.
 * Judging that estimate with a 15-second window returns nothing and makes a genuine report
 * look unsupported.
 *
 * ±2 minutes is not a free choice — it MUST match `BatteryInternalService.SnapshotWindow`,
 * the window the backend uses to build the sensor snapshot that AI verify scores against.
 * If the two drift apart, the Manager reads a verdict ("matches sensor data") computed from
 * readings the evidence table below it never shows, and has no way to reconcile them.
 * At 10s per reading that window holds ~24 rows — comfortably above the 5-breach noise
 * threshold the backend itself uses to conclude a fault is real.
 */
const AUTO_WINDOW_MS = 15 * 1_000; // ±15s — machine timestamp, exact
const MANUAL_WINDOW_MS = 2 * 60 * 1_000; // ±2' — human estimate; mirrors SnapshotWindow

/**
 * Sensor log around the incident detection time — serves as EVIDENCE for the ticket, NOT the
 * current real-time log. Only rows breaching the battery type's thresholds are rendered
 * (see `toWarningRows`). Query is disabled when assetId or detectedAt is missing.
 *
 * @param isManualReport true when a human supplied `detectedAt` (Customer- or Staff-created
 *   ticket). Defaults to false so an omitted flag yields the strict machine window rather
 *   than silently widening the search for auto tickets.
 */
export function useReadingEvidence(
  assetId: string | null | undefined,
  detectedAt: string | null | undefined,
  isManualReport = false,
) {
  const windowMs = isManualReport ? MANUAL_WINDOW_MS : AUTO_WINDOW_MS;

  // Both sides of detectedAt: an auto run sends several readings in a burst so the breach can
  // sit either side of the stamp, and a human estimate is just as likely early as late.
  const from = detectedAt
    ? new Date(new Date(detectedAt).getTime() - windowMs).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(new Date(detectedAt).getTime() + windowMs).toISOString()
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

/**
 * Thresholds come from the battery type's own `ThresholdConfig` — the very row `AnomalyRules`
 * on the backend reads to raise the alert. They must NOT be hardcoded here: the fleet mixes
 * 12V/24V/48V packs with different chemistries, so one set of numbers cannot describe them all,
 * and any constant we pick will silently drift away from what the backend actually enforced.
 *
 * Passing `undefined` disables every rule and yields no evidence rows — deliberate. Showing
 * rows judged against guessed limits is worse than showing none, because the Manager would be
 * cross-checking a ticket against a threshold the system never applied.
 */
export interface EvidenceThresholds {
  temperatureMax: number;
  temperatureMin: number;
  socWarningThreshold: number;
  currentMaxCharge?: number;
  currentMaxDischarge?: number;
}

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // warning labels ("Overheating 72°C > 60°C"...); empty = within limits
}

/**
 * Keep only the readings that breach the battery type's configured limits, labelling each with
 * the measured value AND the limit it crossed, so the row itself shows why it is evidence.
 *
 * Every anomaly the backend can raise from a reading needs a rule here. Undertemp used to be
 * missing, and the gap was not a cosmetic one: a −18°C reading matched nothing and vanished
 * from the list, while a 72°C row left over from an earlier Overheat run on the same battery
 * did match and took its place — the Undertemp ticket displayed "Overheating 72°C" as its own
 * evidence. A missing rule does not merely hide a row; it hands the slot to a neighbouring case.
 */
export function toWarningRows(
  readings: SensorReadingDto[],
  thresholds?: EvidenceThresholds,
): ReadingWarning[] {
  if (!thresholds) return [];

  const rows: ReadingWarning[] = [];
  for (const r of readings) {
    const reasons: string[] = [];

    if (r.temperature > thresholds.temperatureMax)
      reasons.push(
        `Overheating ${r.temperature.toFixed(0)}°C > ${thresholds.temperatureMax.toFixed(0)}°C`,
      );
    if (r.temperature < thresholds.temperatureMin)
      reasons.push(
        `Low temperature ${r.temperature.toFixed(0)}°C < ${thresholds.temperatureMin.toFixed(0)}°C`,
      );
    if (r.socPercent < thresholds.socWarningThreshold)
      reasons.push(
        `Low SOC ${r.socPercent.toFixed(0)}% < ${thresholds.socWarningThreshold.toFixed(0)}%`,
      );

    // Current carries direction in its sign: positive = charging, negative = discharging.
    // Both limits are optional in the config — a null column means the backend never raises
    // that anomaly for this battery type, so we must not invent a limit of our own.
    if (
      thresholds.currentMaxCharge !== undefined &&
      thresholds.currentMaxCharge !== null &&
      r.current > thresholds.currentMaxCharge
    )
      reasons.push(
        `Charging current ${r.current.toFixed(0)}A > ${thresholds.currentMaxCharge.toFixed(0)}A`,
      );
    if (
      thresholds.currentMaxDischarge !== undefined &&
      thresholds.currentMaxDischarge !== null &&
      r.current < -thresholds.currentMaxDischarge
    )
      reasons.push(
        `Discharge current ${Math.abs(r.current).toFixed(0)}A > ${thresholds.currentMaxDischarge.toFixed(0)}A`,
      );

    // Giữ CẢ dòng không vi phạm. Trước đây lọc bỏ chúng, nên một ticket có đầy đủ số đo
    // nhưng đều trong ngưỡng lại hiện bảng trống — Manager đọc thành "không có dữ liệu" và
    // mất luôn căn cứ để bác một ticket khai khống. Số đo bình thường quanh thời điểm khai
    // báo CŨNG là bằng chứng, chỉ là bằng chứng theo chiều ngược lại.
    rows.push({ reading: r, reasons });
  }
  return rows;
}

/** Số dòng thực sự vượt ngưỡng — dùng cho badge đếm và câu tóm tắt phía trên bảng. */
export function countBreaches(rows: ReadingWarning[]): number {
  return rows.filter((r) => r.reasons.length > 0).length;
}
