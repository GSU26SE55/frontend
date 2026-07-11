import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadingHistory } from "@/features/admin/hooks/useReadingHistory";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { SensorReadingDto } from "@/features/admin/types/sensor-reading.types";

const num = (v: number | null, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface SensorHistoryTableProps {
  assetId: string;
  fillHeight?: boolean;
}

const columns: ColumnDef<SensorReadingDto>[] = [
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
    cell: (r) => num(r.voltage),
  },
  {
    id: "current",
    header: "Dòng (A)",
    sortKey: "current",
    sortValue: (r) => r.current,
    headClassName: "w-[18%] text-right",
    cellClassName: "text-right tabular-nums",
    cell: (r) => num(r.current),
  },
  {
    id: "temperature",
    header: "Nhiệt độ (°C)",
    sortKey: "temperature",
    sortValue: (r) => r.temperature,
    headClassName: "w-[18%] text-right",
    cellClassName: "text-right tabular-nums",
    cell: (r) => num(r.temperature, 1),
  },
  {
    id: "socPercent",
    header: "SOC (%)",
    sortKey: "socPercent",
    sortValue: (r) => r.socPercent,
    headClassName: "w-[18%] text-right",
    cellClassName: "text-right tabular-nums",
    cell: (r) => num(r.socPercent, 1),
  },
];

export default function SensorHistoryTable({
  assetId,
  fillHeight,
}: SensorHistoryTableProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, { limit: 50 });

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
        <div className="px-5 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium">Lịch sử cảm biến</span>
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
