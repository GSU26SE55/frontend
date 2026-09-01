import { useState } from "react";
import { Thermometer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAmbientEvidence } from "@/shared/hooks/ambient/useAmbientEvidence";
import { useAmbientThresholdBySite } from "@/shared/hooks/ambient/useAmbient";
import {
  evaluateAmbientRow,
  ambientLevelTextClass,
} from "@/shared/lib/ambientThresholds";
import { formatDateTime } from "@/shared/utils/datetime";

/** Rows shown before "Show more" — matches the battery evidence panel. */
const PREVIEW_ROWS = 10;
const LOAD_MORE_STEP = 25;

const fmt = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface Props {
  siteId?: string | null;
  /**
   * Anchor for the ±2' window — the incident's `detectedAt` (when the condition was observed),
   * not `createdAt`, which on a manual report can trail the event by hours.
   */
  anchorAt?: string | null;
}

/**
 * Ambient readings around an environmental incident — the site-level counterpart of
 * `BatteryWarningEvidencePanel`.
 *
 * A site ticket used to show a single parsed sensor line ("MQ-2 raw=3100 > thr=2000") and
 * nothing else, so there was no way to tell a genuine event from one stray sample. A battery
 * ticket right beside it showed the temperature climbing 41→71°C across a dozen rows. This
 * gives the site ticket the same standard of evidence, and colours each value against the
 * site's OWN configured thresholds — the same numbers the "Alert threshold" drawer edits and
 * the backend alerts on — so a breach is visible at a glance instead of read off a number.
 *
 * Filtering is done by the BACKEND (`GetAmbientReadingHistoryQuery` applies `Time >= From` /
 * `Time <= To`), not by trimming a full page client-side.
 */
export default function AmbientEvidencePanel({ siteId, anchorAt }: Props) {
  const { data, isLoading } = useAmbientEvidence(siteId, anchorAt);
  const { data: threshold } = useAmbientThresholdBySite(siteId ?? "");
  const [limit, setLimit] = useState(PREVIEW_ROWS);

  // Newest first — BE tra ve san `OrderByDescending(r => r.Time)`, khong sort lai.
  // Truoc day panel nay dao nguoc thanh cu->moi, gay hai van de: no la panel DUY NHAT lam vay
  // (`BatteryWarningEvidencePanel` ngay ben canh giu nguyen thu tu cua BE), va vi ban xem truoc
  // chi lay 10 dong DAU, nguoi doc nhan duoc 10 dong CU nhat — dung nhung dong bien dong dan
  // toi su co lai bi giau sau nut "Show more".
  const allRows = data?.items ?? [];

  // Chỉ giữ dòng THỰC SỰ vi phạm ngưỡng — đó là dòng làm alert nổ và ticket ra đời.
  //
  // Cửa sổ ±2' quanh mốc phát hiện với thiết bị đẩy ambient mỗi 15s cho ra ~16 dòng, phần lớn
  // hoàn toàn bình thường. Bảng vì thế đọc như một đoạn log chép nguyên si, người trực phải tự
  // dò xem dòng nào là lý do mình đang nhìn cái ticket này. Cùng khuôn với bảng bằng chứng của
  // pin ngay dưới: dẫn bằng vi phạm, phần còn lại nằm sau nút "Show more".
  const graded = allRows.map((r) => ({ row: r, ev: evaluateAmbientRow(r, threshold) }));
  const breaching = graded.filter((g) => g.ev.worst === "warning" || g.ev.worst === "critical");
  // Không có dòng nào vi phạm (ngưỡng site tắt, hoặc alert đến từ kênh khác) → hiện toàn bộ
  // thay vì một bảng rỗng: bằng chứng vẫn đáng đọc, chỉ là không tô được dòng nào.
  const rows = breaching.length > 0 ? breaching.map((g) => g.row) : allRows;
  const visible = rows.slice(0, limit);
  const hidden = rows.length - visible.length;
  const trimmed = breaching.length > 0 ? allRows.length - rows.length : 0;

  if (!siteId || !anchorAt) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        <Thermometer className="size-4 text-amber-600" />
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          Site readings
        </p>
      </div>

      {trimmed > 0 ? (
        <p className="text-2xs text-muted-foreground mb-1.5">
          Showing the {rows.length} reading{rows.length > 1 ? "s" : ""} that breached a
          configured limit · {trimmed} normal reading{trimmed > 1 ? "s" : ""} in this window
          hidden.
        </p>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : rows.length === 0 ? (
        // Distinguish "sensor reported nothing" from "we failed to load": the incident is still
        // valid, its evidence just isn't in the ambient log.
        <p className="text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
          No ambient readings recorded in this window.
        </p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium px-2 py-1.5">Time</th>
                  <th className="text-right font-medium px-2 py-1.5">°C</th>
                  <th className="text-right font-medium px-2 py-1.5">Gas%</th>
                  <th className="text-right font-medium px-2 py-1.5">Water</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const ev = evaluateAmbientRow(r, threshold);
                  return (
                    <tr key={r.time} className="border-t border-border/50">
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatDateTime(r.time)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${ambientLevelTextClass(ev.temperature)}`}
                      >
                        {fmt(r.ambientTemperature)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${ambientLevelTextClass(ev.gas)}`}
                      >
                        {fmt(r.gasConcentration)}
                      </td>
                      {/* Boolean nên viết chữ, không phải số: "Wet" đọc ra ngay là sự cố, còn
                          "1"/"0" thì người trực phải đoán chiều nào là ướt. */}
                      <td
                        className={`px-2 py-1.5 text-right ${ambientLevelTextClass(ev.water)}`}
                      >
                        {r.waterLeakDetected === null ||
                        r.waterLeakDetected === undefined
                          ? "—"
                          : r.waterLeakDetected
                            ? "Wet"
                            : "Dry"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hidden > 0 ? (
            <button
              type="button"
              className="w-full border-t border-border/50 py-1.5 text-xs text-amber-700 dark:text-amber-500 hover:bg-muted/50"
              onClick={() => setLimit((n) => n + LOAD_MORE_STEP)}
            >
              Show {Math.min(hidden, LOAD_MORE_STEP)} more rows ({hidden} left)
            </button>
          ) : null}
        </div>
      )}

      {threshold && !threshold.enabled ? (
        <p className="text-2xs text-muted-foreground mt-1.5">
          Threshold monitoring is off for this site — values are shown unmarked.
        </p>
      ) : null}
    </div>
  );
}
