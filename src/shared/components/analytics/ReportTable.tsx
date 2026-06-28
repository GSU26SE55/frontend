import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReportColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface ReportTableProps<T> {
  columns: ReportColumn<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  emptyText?: string;
  rowKey: (row: T, index: number) => string;
}

// Bảng generic cho report dạng tabular. Tự xử lý loading / empty.
export function ReportTable<T>({
  columns,
  rows,
  isLoading,
  emptyText = "Không có dữ liệu.",
  rowKey,
}: ReportTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {emptyText}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={col.align === "right" ? "text-right" : undefined}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={rowKey(row, i)}>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={
                  col.align === "right" ? "text-right tabular-nums" : undefined
                }
              >
                {col.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
