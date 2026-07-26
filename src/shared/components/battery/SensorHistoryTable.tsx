import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadingHistory } from "@/shared/hooks/battery/useReadingHistory";
import { useThresholdByType } from "@/shared/hooks/battery/useThresholds";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { useServerSort } from "@/shared/hooks/useServerSort";
import { toneText, type StatusTone } from "@/shared/theme/statusColors";
import type {
  SensorReadingDto,
  SensorReadingSortKey,
} from "@/shared/types/battery/sensor-reading-history.types";
import type { ThresholdConfigDto } from "@/shared/types/battery/threshold.types";

// datetime-local (giờ địa phương, không timezone) → ISO UTC cho API. "" → undefined.
const toUtc = (local: string): string | undefined =>
  local ? new Date(local).toISOString() : undefined;

const num = (v: number | null, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

// ── Tô màu ô theo ngưỡng (đồng bộ vùng an toàn / danger zone của SensorChart) ──
// Trong [min,max] = ok; sát mép (10% biên) = cảnh báo (p2); ngoài dải = nguy hiểm (p1).
function rangeTone(value: number, min: number, max: number): StatusTone {
  if (value < min || value > max) return "p1";
  const margin = (max - min) * 0.1;
  if (value <= min + margin || value >= max - margin) return "p2";
  return "ok";
}

// SOC chỉ nguy hiểm khi THẤP: ≤ critical → p1, ≤ warning → p2, còn lại ok.
function socTone(soc: number, warn: number, crit: number): StatusTone {
  if (soc <= crit) return "p1";
  if (soc <= warn) return "p2";
  return "ok";
}

function voltageTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? rangeTone(v, t.voltageMin, t.voltageMax) : null;
}
function temperatureTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? rangeTone(v, t.temperatureMin, t.temperatureMax) : null;
}
// currentMaxCharge/currentMaxDischarge là optional trong ThresholdConfigDto.
// Chưa cấu hình → KHÔNG tô màu cột Dòng (trả null), thay vì đoán một ngưỡng mặc
// định: màu suy ra từ ngưỡng bịa sẽ lệch với cảnh báo BE bắn theo ngưỡng thật,
// khiến người xem tin nhầm là đã đối chiếu.
function currentTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  if (!t) return null; // chưa có cấu hình ngưỡng → cả bảng không tô (giữ đồng bộ)
  if (t.currentMaxCharge == null || t.currentMaxDischarge == null) return null;
  return rangeTone(v, -t.currentMaxDischarge, t.currentMaxCharge);
}
function socOf(v: number, t?: ThresholdConfigDto): StatusTone | null {
  return t ? socTone(v, t.socWarningThreshold, t.socCriticalThreshold) : null;
}

// Số có màu theo tone (chưa có ngưỡng → hiển thị trung tính).
function ToneNum({
  value,
  tone,
  digits = 2,
}: {
  value: number | null;
  tone: StatusTone | null;
  digits?: number;
}) {
  const text = num(value, digits);
  if (tone === null || value === null || value === undefined)
    return <>{text}</>;
  return <span className={cn("font-semibold", toneText(tone))}>{text}</span>;
}

function buildColumns(
  threshold?: ThresholdConfigDto,
): ColumnDef<SensorReadingDto>[] {
  return [
    {
      id: "time",
      header: "Thời điểm",
      headClassName: "w-[20%]",
      sortKey: "time",
      sortValue: (r) => new Date(r.time).getTime(),
      cellClassName: "tabular-nums",
      cell: (r) => new Date(r.time).toLocaleString("vi-VN"),
    },
    {
      id: "voltage",
      header: "Điện áp (V)",
      sortKey: "voltage",
      sortValue: (r) => r.voltage,
      headClassName: "w-[10%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum value={r.voltage} tone={voltageTone(r.voltage, threshold)} />
      ),
    },
    {
      id: "current",
      header: "Dòng (A)",
      sortKey: "current",
      sortValue: (r) => r.current,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum value={r.current} tone={currentTone(r.current, threshold)} />
      ),
    },
    {
      id: "temperature",
      header: "Nhiệt độ (°C)",
      sortKey: "temperature",
      sortValue: (r) => r.temperature,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum
          value={r.temperature}
          tone={temperatureTone(r.temperature, threshold)}
          digits={1}
        />
      ),
    },
    {
      id: "socPercent",
      header: "SOC (%)",
      sortKey: "socPercent",
      sortValue: (r) => r.socPercent,
      headClassName: "w-[18%] text-right",
      cellClassName: "text-right tabular-nums",
      cell: (r) => (
        <ToneNum
          value={r.socPercent}
          tone={socOf(r.socPercent, threshold)}
          digits={1}
        />
      ),
    },
  ];
}

interface SensorHistoryTableProps {
  assetId: string;
  batteryTypeId?: string;
  fillHeight?: boolean;
}

export default function SensorHistoryTable({
  assetId,
  batteryTypeId,
  fillHeight,
}: SensorHistoryTableProps) {
  // Sort server-side (Hướng B). Mặc định null → BE trả time desc + cursor bình thường.
  const sort = useServerSort();
  // Bộ lọc khoảng thời gian (datetime-local, giờ địa phương).
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");

  const from = toUtc(fromLocal);
  const to = toUtc(toLocal);

  // Hướng B: sort field ≠ time BẮT BUỘC có from+to (thiếu → BE 400). Nếu người dùng
  // chọn sort khác time mà chưa nhập đủ khoảng → chưa áp sort (fallback time desc) + báo.
  const isFieldSort = !!sort.sortBy && sort.sortBy !== "time";
  const rangeMissing = isFieldSort && (!from || !to);
  const activeSortBy: SensorReadingSortKey | undefined =
    !sort.sortBy || rangeMissing
      ? undefined
      : (sort.sortBy as SensorReadingSortKey);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, {
      limit: 50,
      from,
      to,
      sortBy: activeSortBy,
      sortDir: activeSortBy ? sort.sortDir : undefined,
    });
  // Ngưỡng theo loại pin — dùng chung nguồn với SensorChart (dedup cache).
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");

  const columns = useMemo(() => buildColumns(threshold), [threshold]);

  const rows = data?.pages.flatMap((p) => p?.items ?? []) ?? [];

  const hasFilter = !!fromLocal || !!toLocal;

  // Bảng không tô màu trông y hệt "mọi giá trị đều bình thường" → phải nói rõ là
  // thiếu ngưỡng, không phải đã đối chiếu xong.
  const missingThresholdNote = !threshold
    ? "Loại pin này chưa cấu hình ngưỡng — số liệu bên dưới không được đối chiếu."
    : threshold.currentMaxCharge == null ||
        threshold.currentMaxDischarge == null
      ? "Chưa cấu hình ngưỡng dòng nạp/xả — cột Dòng (A) không được đối chiếu."
      : null;

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3 px-5 py-3 border-b border-border">
      <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        Từ
        <Input
          type="datetime-local"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
          className="h-8 w-52"
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        Đến
        <Input
          type="datetime-local"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
          className="h-8 w-52"
        />
      </label>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFromLocal("");
            setToLocal("");
          }}
        >
          Xóa lọc
        </Button>
      )}
      {rangeMissing && (
        <span className="text-[11px] text-amber-600 dark:text-amber-500 pb-1.5">
          Chọn cả “Từ” và “Đến” để sắp xếp theo cột này.
        </span>
      )}
    </div>
  );

  const thresholdNotice = missingThresholdNote && (
    <div className="flex items-start gap-2 px-5 py-2.5 border-b border-border text-[11px] text-amber-600 dark:text-amber-500">
      <TriangleAlert className="size-3.5 shrink-0 mt-px" />
      <span>{missingThresholdNote}</span>
    </div>
  );

  const tableContent = isLoading ? (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Đang tải...
    </div>
  ) : rows.length === 0 ? (
    <div className="py-12 text-center text-sm text-muted-foreground">
      Chưa có dữ liệu
    </div>
  ) : (
    <>
      {thresholdNotice}
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.time}
        showIndex
        serverSort={sort}
      />
      {hasNextPage && (
        <div className="py-4 flex justify-center border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
          </Button>
        </div>
      )}
    </>
  );

  if (fillHeight) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Lịch sử cảm biến</span>
          {threshold && (
            <span className="text-[11px] text-muted-foreground">
              Màu theo ngưỡng an toàn của {threshold.batteryTypeName}
            </span>
          )}
        </div>
        {filterBar}
        <div className="flex-1 min-h-0 overflow-y-auto">{tableContent}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Lịch sử cảm biến</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {filterBar}
        <div className="px-6">{tableContent}</div>
      </CardContent>
    </Card>
  );
}
