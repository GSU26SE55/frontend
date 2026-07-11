import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReadingHistory } from "@/features/admin/hooks/useReadingHistory";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

const num = (v: number | null, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface SensorHistoryTableProps {
  assetId: string;
  fillHeight?: boolean;
}

export default function SensorHistoryTable({
  assetId,
  fillHeight,
}: SensorHistoryTableProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, { limit: 50 });

  const rows = data?.pages.flatMap((p) => p?.items ?? []) ?? [];
  const {
    sorted: sortedRows,
    sortKey,
    sortDirection,
    toggleSort,
  } = useSortableData(rows, (r, key) => {
    switch (key) {
      case "time":
        return new Date(r.time);
      case "voltage":
        return r.voltage;
      case "current":
        return r.current;
      case "temperature":
        return r.temperature;
      case "socPercent":
        return r.socPercent;
      default:
        return null;
    }
  });

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
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[20%]" />
          <col className="w-[10%]" />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">STT</TableHead>
            <SortableTableHead
              sortKey="time"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Thời điểm
            </SortableTableHead>
            <SortableTableHead
              sortKey="voltage"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
              className="text-right"
            >
              Điện áp (V)
            </SortableTableHead>
            <SortableTableHead
              sortKey="current"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
              className="text-right"
            >
              Dòng (A)
            </SortableTableHead>
            <SortableTableHead
              sortKey="temperature"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
              className="text-right"
            >
              Nhiệt độ (°C)
            </SortableTableHead>
            <SortableTableHead
              sortKey="socPercent"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
              className="text-right"
            >
              SOC (%)
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((r, index) => (
            <TableRow key={r.time}>
              <TableCell className="text-center text-muted-foreground tabular-nums">
                {index + 1}
              </TableCell>
              <TableCell className="tabular-nums">
                {new Date(r.time).toLocaleString("vi-VN")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {num(r.voltage)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {num(r.current)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {num(r.temperature, 1)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {num(r.socPercent, 1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
