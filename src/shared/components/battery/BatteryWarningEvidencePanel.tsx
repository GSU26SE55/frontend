import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReadingEvidence,
  toWarningRows,
  countBreaches,
} from "@/shared/hooks/battery/useReadingEvidence";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";

/** Number of rows shown by default before clicking "Show more". */
const PREVIEW_ROWS = 10;
/** How many extra rows each "Show more" click reveals. */
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface Props {
  batteryAssetId?: string | null;
  /** When the incident was detected — anchor point for fetching evidence logs (±2'). */
  detectedAt?: string | null;
  /** Battery type of the asset — needed to read the SAME thresholds the backend enforced. */
  batteryTypeId?: string | null;
}

/**
 * Alert evidence — shows ONLY the readings that breached this battery type's configured
 * thresholds around the detection time, NOT the normal real-time log. Used by Manager to
 * cross-check that a ticket really is backed by the sensor data. Shared by manager + staff.
 *
 * Thresholds are fetched per battery type rather than hardcoded, so the panel judges rows by
 * exactly the limits `AnomalyRules` used when it raised the alert.
 */
export default function BatteryWarningEvidencePanel({
  batteryAssetId,
  detectedAt,
  batteryTypeId,
}: Props) {
  const { data, isLoading } = useReadingEvidence(batteryAssetId, detectedAt);
  const { data: threshold, isLoading: isThresholdLoading } = useThresholdByType(
    batteryTypeId ?? "",
    undefined,
    !!batteryTypeId,
  );
  const warnings = toWarningRows(
    data?.items ?? [],
    threshold
      ? {
          temperatureMax: threshold.temperatureMax,
          temperatureMin: threshold.temperatureMin,
          socWarningThreshold: threshold.socWarningThreshold,
          currentMaxCharge: threshold.currentMaxCharge,
          currentMaxDischarge: threshold.currentMaxDischarge,
        }
      : undefined,
  );

  // Chỉ những dòng thật sự vượt ngưỡng mới được tính là "bằng chứng"; phần còn lại là bối
  // cảnh xung quanh, vẫn phải hiện để người đọc thấy pin lúc đó ra sao.
  const breachCount = countBreaches(warnings);

  // A ±2' window at 5s frequency yields a few dozen rows — rendering them all would
  // swallow the whole page. Defaults to 10 rows, each "Show more" reveals 25 (matches mobile).
  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const visibleRows = warnings.slice(0, limit);
  const hiddenCount = warnings.length - visibleRows.length;

  // No battery, or the ticket has no detection timestamp → no evidence to show.
  if (!batteryAssetId || !detectedAt) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="size-4 text-amber-600" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Alert evidence (at detection time)
        </p>
        {breachCount > 0 && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            {breachCount}
          </span>
        )}
      </div>

      {isLoading || isThresholdLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !threshold ? (
        // No config for this battery type → the backend has no limits to enforce either.
        // Say so plainly instead of rendering rows judged against thresholds we invented.
        <p className="text-sm text-muted-foreground text-center py-4">
          This battery type has no threshold config — no basis to flag readings.
        </p>
      ) : warnings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No sensor readings around the detection time.
        </p>
      ) : (
        <>
          {breachCount === 0 && (
            // Có số đo nhưng không dòng nào vượt ngưỡng. Nói thẳng ra thay vì để bảng tự nói —
            // đây chính là căn cứ để Manager bác một ticket khai khống.
            <p className="mb-2 text-xs text-muted-foreground">
              No reading breached the configured limits — the rows below are the
              sensor context around the reported time.
            </p>
          )}
          <div className="rounded-md border border-amber-300 dark:border-amber-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 dark:bg-amber-950/40">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                    V
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                    A
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                    °C
                  </th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">
                    SOC%
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                    Alert
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60 dark:divide-amber-900/60">
                {visibleRows.map(({ reading: r, reasons }) => {
                  // The reading stamped at DetectedAt is the one that tipped the counter and
                  // caused the alert. Marking it separates cause from the surrounding context.
                  const isTrigger =
                    !!detectedAt &&
                    new Date(r.time).getTime() ===
                      new Date(detectedAt).getTime();
                  return (
                    <tr
                      key={r.time}
                      className={
                        isTrigger
                          ? "bg-amber-100 dark:bg-amber-900/40 font-medium"
                          : reasons.length > 0
                            ? "bg-amber-50/50 dark:bg-amber-950/20"
                            : // Trong ngưỡng — để nền trung tính. Tô vàng mọi dòng thì màu mất
                              // hết ý nghĩa và người đọc không phân biệt được dòng nào bất thường.
                              ""
                      }
                    >
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground whitespace-nowrap">
                        {new Date(r.time).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {num(r.voltage)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {num(r.current)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${
                          reasons.some(
                            (x) =>
                              x.startsWith("Overheating") ||
                              x.startsWith("Low temperature"),
                          )
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : ""
                        }`}
                      >
                        {num(r.temperature, 1)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {num(r.socPercent, 1)}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {reasons.map((reason) => (
                            <span
                              key={reason}
                              className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setLimit((v) => v + LOAD_MORE_STEP)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
              >
                Show {Math.min(LOAD_MORE_STEP, hiddenCount)} more rows
                <span className="font-normal text-muted-foreground">
                  {hiddenCount} left
                </span>
                <ChevronDown className="size-3.5" />
              </button>
            )}

            {hiddenCount === 0 && warnings.length > PREVIEW_ROWS && (
              <button
                type="button"
                onClick={() => setLimit(PREVIEW_ROWS)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
              >
                Collapse
                <ChevronUp className="size-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
