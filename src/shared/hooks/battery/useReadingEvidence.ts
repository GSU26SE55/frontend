import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import { ANOMALY_TYPE_LABELS } from "@/shared/constants/alertLabels";
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
 *   `ManualByCustomer` — a person typed in when they noticed the problem.
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

export interface ReadingWarning {
  reading: SensorReadingDto;
  reasons: string[]; // warning labels ("Overheating 72°C > 60°C"...); empty = within limits
}

/**
 * Gắn nhãn cảnh báo cho từng dòng số đo, dựa trên anomaly BE ĐÃ CHẤM (`reading.anomalies`).
 *
 * Trước đây hàm này tự so số đo với ngưỡng rồi tự ghép chuỗi — tức dựng lại luật của BE ở phía
 * client. Hai vấn đề thực tế: FE chỉ có 7 rule trong khi BE có 17 loại anomaly (Undertemp từng
 * bị thiếu, khiến ticket nhiệt độ thấp hiện nhầm bằng chứng "Overheating 72°C" của lần chạy
 * trước), và severity không hề được tính. Nay BE chấm bằng `AnomalyRules.Detect` với đúng
 * ThresholdConfig của loại pin, FE chỉ dịch sang nhãn.
 *
 * Không còn nhận `thresholds`: ngưỡng nay chỉ BE dùng, truyền vào đây chỉ mời gọi tính lại.
 */
export function toWarningRows(readings: SensorReadingDto[]): ReadingWarning[] {
  return readings.map((r) => ({
    reading: r,
    // Số đo hiện nguyên văn giá trị BE trả về, kèm ngưỡng bị vượt — cùng định dạng cũ
    // ("Undervoltage 0.00V < 10.50V") để không phải sửa chỗ hiển thị.
    reasons: (r.anomalies ?? []).map((a) => {
      const label = ANOMALY_TYPE_LABELS[a.type] ?? a.type;
      // 2 chu so cho MOI don vi — cung do chinh xac voi du lieu (`numeric(x,2)`) va voi
      // `thresholdTone`. Truoc day chi Volt duoc 2 chu so, con lai lam tron ve so nguyen,
      // nen mot vi pham that lai in ra thanh hai so BANG NHAU: nguong 32.6°C, do duoc
      // 32.8°C, nhan hien "Overheat 33°C > 33°C" — khong giai thich duoc gi.
      const digits = 2;
      const actual = a.actualValue.toFixed(digits);
      const limit = a.thresholdValue.toFixed(digits);
      // Hướng so sánh suy từ chính số liệu, nên không cần bảng tra riêng cho từng loại.
      const op = a.actualValue > a.thresholdValue ? ">" : "<";
      return `${label} ${actual}${a.unit} ${op} ${limit}${a.unit}`;
    }),
  }));
}

/** Số dòng thực sự vượt ngưỡng — dùng cho badge đếm và câu tóm tắt phía trên bảng. */
export function countBreaches(rows: ReadingWarning[]): number {
  return rows.filter((r) => r.reasons.length > 0).length;
}
