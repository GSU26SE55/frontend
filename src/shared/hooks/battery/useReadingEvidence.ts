import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingDto } from "@/shared/types/battery/sensor-reading-history.types";

/**
 * How wide to look around `detectedAt` when pulling the evidence log.
 *
 * ±2 minutes, and the number is not free: it MUST match
 * `BatteryInternalService.SnapshotWindow`, the window the backend uses to build the sensor
 * snapshot that AI verify scores against. If the two drift apart, the Manager reads a verdict
 * ("matches sensor data") computed from readings the table below it never shows.
 *
 * The same width serves both kinds of ticket, for different reasons:
 *
 *   `AutoFromAlert` — the scanner stamps the alert with the reading's own `Time`, so the
 *   breach itself sits at the centre. The surrounding minutes are what make it readable as an
 *   *event*: the simulator's warm-up walks the battery up to the limit (31→50→61→67→72°C), and
 *   a ±15s window would clip all of that away, leaving one lone row of round numbers that
 *   looks fabricated. One reading proves a threshold was crossed; it cannot show a battery
 *   heating up.
 *
 *   `ManualByCustomer` / `CreatedByStaff` — a person typed in when they noticed the problem.
 *   Nobody recalls an incident to the second; they enter "3pm" for something seen around 3pm.
 *
 * At 10s per reading the window holds ~24 rows — comfortably above the 5-breach noise
 * threshold the backend itself uses to conclude a fault is real.
 *
 * The cost is real and worth naming: two cases run on the same battery less than 2 minutes
 * apart will bleed into each other's evidence. That is how an Undertemp ticket once displayed
 * the 72°C row belonging to an Overheat ticket. Demos run one case at a time, and the
 * per-reading threshold labels make a foreign row obvious, so the trade lands on the side of
 * showing the story rather than hiding it.
 */
const EVIDENCE_WINDOW_MS = 2 * 60 * 1_000; // ±2' — mirrors BatteryInternalService.SnapshotWindow

/**
 * Sensor log around the incident detection time — serves as EVIDENCE for the ticket, NOT the
 * current real-time log. Only rows breaching the battery type's thresholds are rendered
 * (see `toWarningRows`). Query is disabled when assetId or detectedAt is missing.
 *
 */
export function useReadingEvidence(
  assetId: string | null | undefined,
  detectedAt: string | null | undefined,
) {
  // Both sides of detectedAt: an auto run sends several readings in a burst so the breach can
  // sit either side of the stamp, and a human estimate is just as likely early as late.
  const from = detectedAt
    ? new Date(
        new Date(detectedAt).getTime() - EVIDENCE_WINDOW_MS,
      ).toISOString()
    : undefined;
  const to = detectedAt
    ? new Date(
        new Date(detectedAt).getTime() + EVIDENCE_WINDOW_MS,
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
