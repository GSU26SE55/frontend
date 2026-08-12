import { ScrollText, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BatteryAuditLogDto } from "@/features/admin/types/battery/battery-audit.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { toneClass } from "@/shared/theme/statusColors";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

// severity → badge color (display-only; NOT a filter). Semantic token.
const SEVERITY_STYLE: Record<string, string> = {
  Info: toneClass("info"),
  Warning: toneClass("p2"),
  Critical: toneClass("p1"),
  Security: toneClass("p2"),
};

interface BatteryAuditLogTableProps {
  logs: BatteryAuditLogDto[];
  isLoading: boolean;
  isError?: boolean;
  pageNumber: number;
  pageSize: number;
  /**
   * Sort server-side — state from useUrlSort. Optional: shared with the
   * File Audit page (separate endpoint, BE doesn't support sort yet) → not
   * passed → header renders but clicking does nothing (no active key).
   */
  sort?: ServerSortState;
}

export default function BatteryAuditLogTable({
  logs,
  isLoading,
  isError,
  pageNumber,
  pageSize,
  sort,
}: BatteryAuditLogTableProps) {
  // BE already sorts the whole dataset (SortBy/SortDir) → render logs as-is.
  // No sort (File Audit) → header inert (active null, toggle no-op).
  const sortKey = sort?.sortBy ?? null;
  const sortDirection = sort?.sortDir ?? "asc";
  const toggleSort = sort?.toggleSort ?? (() => {});

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-destructive">
        <ScrollText size={32} className="opacity-40" />
        <span className="text-sm">
          Failed to load the audit log. Check your filters or try again.
        </span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <ScrollText size={32} className="opacity-30" />
        <span className="text-sm">No audit logs yet.</span>
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="w-12 text-center">
            {TABLE_COLUMNS.index}
          </TableHead>
          <SortableTableHead
            sortKey="occurredAt"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-44"
          >
            Time
          </SortableTableHead>
          <SortableTableHead
            sortKey="actionCode"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Action
          </SortableTableHead>
          <SortableTableHead
            sortKey="severity"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-28"
          >
            Severity
          </SortableTableHead>
          <SortableTableHead
            sortKey="targetDisplay"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Target
          </SortableTableHead>
          <SortableTableHead
            sortKey="actorAccountId"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-40"
          >
            Actor
          </SortableTableHead>
          <SortableTableHead
            sortKey="isSuccess"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-24 justify-center"
          >
            Result
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log, index) => (
          <TableRow
            key={log.id}
            className="hover:bg-muted/50 transition-colors"
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
              {format(new Date(log.occurredAt), "MM/dd/yyyy HH:mm:ss", {
                locale: enUS,
              })}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{log.actionCode}</span>
                <span className="text-[11px] text-muted-foreground">
                  {log.actionCategory}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`text-[10.5px] ${
                  SEVERITY_STYLE[log.severity] ??
                  "bg-muted text-muted-foreground border-border"
                }`}
              >
                {log.severity}
              </Badge>
            </TableCell>
            <TableCell className="text-sm truncate">
              {log.targetDisplay ?? log.targetId ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-xs font-mono text-muted-foreground truncate">
              {log.actorAccountId ?? "System"}
            </TableCell>
            <TableCell className="text-center">
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full ${
                  log.isSuccess ? toneClass("ok") : toneClass("p1")
                }`}
              >
                {log.isSuccess ? (
                  <CheckCircle2 size={10} />
                ) : (
                  <XCircle size={10} />
                )}
                {log.isSuccess ? "OK" : "FAIL"}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
