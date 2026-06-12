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

const num = (v: number | null, digits = 2) =>
  v !== null && v !== undefined ? v.toFixed(digits) : "—";

interface SensorHistoryTableProps {
  assetId: string;
}

export default function SensorHistoryTable({
  assetId,
}: SensorHistoryTableProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReadingHistory(assetId, { limit: 50 });

  const rows = data?.pages.flatMap((p) => p?.items ?? []) ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Lịch sử cảm biến</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời điểm</TableHead>
                  <TableHead className="text-right">Điện áp (V)</TableHead>
                  <TableHead className="text-right">Dòng (A)</TableHead>
                  <TableHead className="text-right">Nhiệt độ (°C)</TableHead>
                  <TableHead className="text-right">SOC (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.time}>
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
              <div className="pt-3 flex justify-center">
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
        )}
      </CardContent>
    </Card>
  );
}
