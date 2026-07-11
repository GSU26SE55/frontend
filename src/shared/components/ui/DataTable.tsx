import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { EmptyState } from "@/shared/components/ui/EmptyState";

/**
 * Định nghĩa 1 cột cho DataTable.
 * - `header`: nội dung ô tiêu đề (string hoặc node).
 * - `cell`: render ô dữ liệu từ 1 row (+ index toàn cục cho STT).
 * - `sortKey` + `sortValue`: bật sort cho cột (dùng useSortableData). Bỏ → cột tĩnh.
 * - `headClassName` / `cellClassName`: class riêng cho ô tiêu đề / ô dữ liệu.
 */
export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  sortKey?: string;
  sortValue?: (row: T) => string | number | null;
  headClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  /** Thêm cột STT tự động ở đầu (đánh số theo trang). */
  showIndex?: boolean;
  /** Cho cột STT: số bắt đầu = (pageNumber-1)*pageSize. Bỏ → đánh số từ 1. */
  pageNumber?: number;
  pageSize?: number;
  /** Nội dung khi rỗng. Bỏ → EmptyState mặc định. */
  empty?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  showIndex = false,
  pageNumber = 1,
  pageSize = 0,
  empty,
}: DataTableProps<T>) {
  // Map sortKey → sortValue để useSortableData tra cứu.
  const sortAccessors = new Map(
    columns.filter((c) => c.sortKey && c.sortValue).map((c) => [c.sortKey!, c]),
  );
  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData<T>(
    data,
    (row, key) => sortAccessors.get(key)?.sortValue?.(row) ?? null,
  );

  const colSpan = columns.length + (showIndex ? 1 : 0);
  const indexBase = pageSize > 0 ? (pageNumber - 1) * pageSize : 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showIndex && (
            <TableHead className="w-12 text-center">
              {TABLE_COLUMNS.index}
            </TableHead>
          )}
          {columns.map((col) =>
            col.sortKey && col.sortValue ? (
              <SortableTableHead
                key={col.id}
                sortKey={col.sortKey}
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className={col.headClassName}
              >
                {col.header}
              </SortableTableHead>
            ) : (
              <TableHead key={col.id} className={col.headClassName}>
                {col.header}
              </TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="p-0">
              {empty ?? <EmptyState />}
            </TableCell>
          </TableRow>
        ) : (
          sorted.map((row, index) => (
            <TableRow key={rowKey(row)}>
              {showIndex && (
                <TableCell className="text-center text-muted-foreground tabular-nums">
                  {indexBase + index + 1}
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.id} className={col.cellClassName}>
                  {col.cell(row, index)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
