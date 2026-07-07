import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDTO } from "@/shared/types/ticket.types";
import type { PaginationResponse } from "@/shared/types/api.types";
import TicketStatusBadge from "@/shared/components/common/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/common/TicketPriorityBadge";
import DataPagination from "@/shared/components/common/DataPagination";
import { SortableTableHead } from "@/shared/components/common/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

const CATEGORY_LABELS: Record<string, string> = {
  Maintenance: "Bảo trì",
  Repair: "Sửa chữa",
  Inspection: "Kiểm tra",
  Emergency: "Khẩn cấp",
  Replacement: "Thay thế",
  Upgrade: "Nâng cấp",
  Other: "Khác",
  Charging: "Lỗi sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
};

interface Props {
  data?: PaginationResponse<TicketDTO>;
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function AdminTicketTable({
  data,
  isLoading,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const navigate = useNavigate();
  const tickets = data?.items ?? [];
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<TicketDTO>(tickets, (t, key) => {
      switch (key) {
        case "code":
          return t.code;
        case "title":
          return t.title;
        case "category":
          return CATEGORY_LABELS[t.category] ?? t.category;
        case "status":
          return t.status;
        case "priority":
          return t.priority ?? "";
        case "createdAt":
          return new Date(t.createdAt);
        default:
          return null;
      }
    });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Không có ticket nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <SortableTableHead
                sortKey="code"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-32"
              >
                Mã
              </SortableTableHead>
              <SortableTableHead
                sortKey="title"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
              >
                Tiêu đề
              </SortableTableHead>
              <SortableTableHead
                sortKey="category"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-32"
              >
                Loại
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-36"
              >
                Trạng thái
              </SortableTableHead>
              <SortableTableHead
                sortKey="priority"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-32"
              >
                Priority
              </SortableTableHead>
              <SortableTableHead
                sortKey="createdAt"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-36"
              >
                Ngày tạo
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((ticket, index) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
              >
                <TableCell className="text-center text-muted-foreground tabular-nums">
                  {(pageNumber - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-1">
                    {ticket.isIncident && (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {ticket.code}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={ticket.title}>
                  {ticket.title}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
