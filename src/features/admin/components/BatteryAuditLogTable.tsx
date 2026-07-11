import { ScrollText, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
import type { BatteryAuditLogDto } from "@/features/admin/types/battery-audit.types";
import { SortableTableHead } from "@/shared/components/common/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";
import { toneClass } from "@/shared/theme/statusColors";

// severity → màu badge (display-only; KHÔNG phải filter). Token semantic.
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
}

export default function BatteryAuditLogTable({
  logs,
  isLoading,
  isError,
  pageNumber,
  pageSize,
}: BatteryAuditLogTableProps) {
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<BatteryAuditLogDto>(logs, (log, key) => {
      switch (key) {
        case "occurredAt":
          return new Date(log.occurredAt);
        case "actionCode":
          return log.actionCode;
        case "severity":
          return log.severity;
        case "targetDisplay":
          return log.targetDisplay ?? log.targetId ?? "";
        case "actorAccountId":
          return log.actorAccountId ?? "";
        case "isSuccess":
          return log.isSuccess ? 1 : 0;
        default:
          return null;
      }
    });

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
          Không tải được audit log. Kiểm tra lại bộ lọc hoặc thử lại.
        </span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <ScrollText size={32} className="opacity-30" />
        <span className="text-sm">Không có audit log nào.</span>
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="w-12 text-center">STT</TableHead>
          <SortableTableHead
            sortKey="occurredAt"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-44"
          >
            Thời gian
          </SortableTableHead>
          <SortableTableHead
            sortKey="actionCode"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Hành động
          </SortableTableHead>
          <SortableTableHead
            sortKey="severity"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-28"
          >
            Mức độ
          </SortableTableHead>
          <SortableTableHead
            sortKey="targetDisplay"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Đối tượng
          </SortableTableHead>
          <SortableTableHead
            sortKey="actorAccountId"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-40"
          >
            Thực hiện
          </SortableTableHead>
          <SortableTableHead
            sortKey="isSuccess"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="w-24 justify-center"
          >
            Kết quả
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((log, index) => (
          <TableRow
            key={log.id}
            className="hover:bg-muted/50 transition-colors"
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
              {format(new Date(log.occurredAt), "dd/MM/yyyy HH:mm:ss", {
                locale: vi,
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
              {log.actorAccountId ?? "Hệ thống"}
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
