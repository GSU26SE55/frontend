import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReadingHistory } from "@/features/admin/hooks/useReadingHistory";
import { useThresholdByType } from "@/features/admin/hooks/useThresholds";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { toneText, type StatusTone } from "@/shared/theme/statusColors";
import type { SensorReadingDto } from "@/features/admin/types/sensor-reading.types";
import type { ThresholdConfigDto } from "@/features/admin/types/threshold.types";

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
// Ngưỡng dòng mặc định (A) khi loại pin chưa cấu hình currentMax* — để cột Dòng
// vẫn tô màu như các cột khác khi bảng đã có ngưỡng.
const DEFAULT_CURRENT_MAX_A = 20;

function currentTone(v: number, t?: ThresholdConfigDto): StatusTone | null {
  if (!t) return null; // chưa có cấu hình ngưỡng → cả bảng không tô (giữ đồng bộ)
  const maxCharge = t.currentMaxCharge ?? DEFAULT_CURRENT_MAX_A;
  const maxDischarge = t.currentMaxDischarge ?? DEFAULT_CURRENT_MAX_A;
  return rangeTone(v, -maxDischarge, maxCharge);
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
  if (tone === null || value === null || value === undefined) return <>{text}</>;
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
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, { limit: 50 });
  // Ngưỡng theo loại pin — dùng chung nguồn với SensorChart (dedup cache).
  const { data: threshold } = useThresholdByType(batteryTypeId ?? "");

  const columns = useMemo(() => buildColumns(threshold), [threshold]);

  const rows = data?.pages.flatMap((p) => p?.items ?? []) ?? [];

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
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.time}
        showIndex
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
        <div className="flex-1 min-h-0 overflow-y-auto">{tableContent}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Lịch sử cảm biến</CardTitle>
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
}
