import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReadingEvidence,
  toWarningRows,
} from "@/shared/hooks/battery/useReadingEvidence";

/** Số dòng hiện sẵn trước khi bấm "Xem thêm". */
const PREVIEW_ROWS = 10;
/** Mỗi lần bấm "Xem thêm" mở thêm bấy nhiêu dòng. */
const LOAD_MORE_STEP = 25;

const num = (v: number | null | undefined, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface Props {
  batteryAssetId?: string | null;
  /** Thời điểm Customer phát hiện sự cố — mốc để lấy log bằng chứng (±15'). */
  detectedAt?: string | null;
}

/**
 * Bằng chứng cảnh báo — CHỈ hiển thị các reading WARNING (vượt ngưỡng) quanh thời điểm
 * phát hiện sự cố (DetectedAt ±15'), KHÔNG phải log real-time bình thường. Dùng để Manager
 * đối chiếu ticket thủ công có thật hay không. Dùng chung manager + staff.
 */
export default function BatteryWarningEvidencePanel({
  batteryAssetId,
  detectedAt,
}: Props) {
  const { data, isLoading } = useReadingEvidence(batteryAssetId, detectedAt);
  const warnings = toWarningRows(data?.items ?? []);

  // Cửa sổ ±15' ở tần suất 5s cho ra vài trăm dòng — đổ hết thì bảng nuốt trọn trang.
  // Mặc định 10 dòng, mỗi lần "Xem thêm" mở thêm 25 (đồng bộ với bản mobile).
  const [limit, setLimit] = useState(PREVIEW_ROWS);
  const visibleRows = warnings.slice(0, limit);
  const hiddenCount = warnings.length - visibleRows.length;

  // Không có pin hoặc ticket không có mốc phát hiện → không có bằng chứng để hiện.
  if (!batteryAssetId || !detectedAt) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="size-4 text-amber-600" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Bằng chứng cảnh báo (lúc phát hiện)
        </p>
        {warnings.length > 0 && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
            {warnings.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : warnings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Không có cảnh báo bất thường quanh thời điểm phát hiện.
        </p>
      ) : (
        <div className="rounded-md border border-amber-300 dark:border-amber-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-amber-50 dark:bg-amber-950/40">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Thời điểm
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
                  Cảnh báo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/60 dark:divide-amber-900/60">
              {visibleRows.map(({ reading: r, reasons }) => (
                <tr
                  key={r.time}
                  className="bg-amber-50/50 dark:bg-amber-950/20"
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
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium text-amber-700 dark:text-amber-400">
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
              ))}
            </tbody>
          </table>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setLimit((v) => v + LOAD_MORE_STEP)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-amber-200/60 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              Xem thêm {Math.min(LOAD_MORE_STEP, hiddenCount)} dòng
              <span className="font-normal text-muted-foreground">
                còn {hiddenCount}
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
              Thu gọn
              <ChevronUp className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
