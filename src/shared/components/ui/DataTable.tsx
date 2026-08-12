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
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/shared/components/ui/EmptyState";

/**
 * Defines 1 column for DataTable.
 * - `header`: header cell content (string or node).
 * - `cell`: renders the data cell from 1 row (+ global index for row numbering).
 * - `sortKey` + `sortValue`: enables sorting for the column (uses useSortableData). Omit → static column.
 * - `headClassName` / `cellClassName`: dedicated class for the header cell / data cell.
 */
export interface ColumnDef<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  sortKey?: string;
  sortValue?: (row: T) => string | number | null;
  headClassName?: string;
  cellClassName?: string;
  /**
   * This cell holds an interactive button/menu → blocks the click from bubbling to the row
   * (avoids onRowClick). Set true for the "Actions" column when the table has onRowClick.
   */
  stopRowClick?: boolean;
  /**
   * Click behavior for this cell (optional — omit = cell isn't clickable).
   * Lets each column choose its own interaction, independent of the row's onRowClick:
   *   - Link to detail: onCellClick: (r) => navigate(`/x/${r.id}`)
   *   - Open a modal:   onCellClick: (r) => setEditing(r)
   *   - Nothing:        leave it out
   * Automatically adds cursor-pointer + stops the click from bubbling to the row.
   */
  onCellClick?: (row: T) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  /** Auto-adds a row-number column at the start (numbered per page). */
  showIndex?: boolean;
  /** For the row-number column: starting number = (pageNumber-1)*pageSize. Omit → numbers from 1. */
  pageNumber?: number;
  pageSize?: number;
  /** Content when empty. Omit → default EmptyState. */
  empty?: ReactNode;
  /** Click on a row (e.g. navigate to a detail page). Omit → row isn't clickable. */
  onRowClick?: (row: T) => void;
  /**
   * Enables **server-side** sort: pass state from `useServerSort`. With this prop,
   * DataTable does NOT sort `data` itself (the BE already sorted the whole dataset) — clicking
   * the header only changes `sortBy`/`sortDir` for the hook to refetch. `col.sortKey` must
   * match the BE's whitelist. Omit the prop → keeps the old client-side sort (useSortableData).
   */
  serverSort?: ServerSortState;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  showIndex = false,
  pageNumber = 1,
  pageSize = 0,
  empty,
  onRowClick,
  serverSort,
}: DataTableProps<T>) {
  // Map sortKey → sortValue for useSortableData to look up (used only for client-sort).
  const sortAccessors = new Map(
    columns.filter((c) => c.sortKey && c.sortValue).map((c) => [c.sortKey!, c]),
  );
  const client = useSortableData<T>(
    data,
    (row, key) => sortAccessors.get(key)?.sortValue?.(row) ?? null,
  );

  // Server-sort: the BE already sorted the whole dataset → render data as-is, the header
  // gets its state from serverSort. Client-sort (default): uses useSortableData as before.
  const sorted = serverSort ? data : client.sorted;
  const sortKey = serverSort ? serverSort.sortBy : client.sortKey;
  const sortDirection = serverSort ? serverSort.sortDir : client.sortDirection;
  const toggleSort = serverSort ? serverSort.toggleSort : client.toggleSort;

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
            col.sortKey && (serverSort ? true : col.sortValue) ? (
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
            <TableRow
              key={rowKey(row)}
              className={
                onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {showIndex && (
                <TableCell className="text-center text-muted-foreground tabular-nums">
                  {indexBase + index + 1}
                </TableCell>
              )}
              {columns.map((col) => {
                // Cell-specific click (link/modal) OR just blocking the bubble (action column).
                const handleCellClick =
                  col.onCellClick || col.stopRowClick
                    ? (e: React.MouseEvent) => {
                        e.stopPropagation();
                        col.onCellClick?.(row);
                      }
                    : undefined;
                return (
                  <TableCell
                    key={col.id}
                    className={cn(
                      col.cellClassName,
                      col.onCellClick && "cursor-pointer",
                    )}
                    onClick={handleCellClick}
                  >
                    {col.cell(row, index)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
