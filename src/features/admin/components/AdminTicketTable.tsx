import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDTO } from "@/shared/types/ticket.types";
import type { PaginationResponse } from "@/shared/types/api.types";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import DataPagination from "@/shared/components/ui/DataPagination";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";

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

  const columns: ColumnDef<TicketDTO>[] = [
    {
      id: "code",
      header: "Mã",
      sortKey: "code",
      sortValue: (t) => t.code,
      headClassName: "w-32",
      cellClassName: "font-mono text-sm",
      cell: (t) => (
        <div className="flex items-center gap-1">
          {t.isIncident && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          )}
          {t.code}
        </div>
      ),
    },
    {
      id: "title",
      header: "Tiêu đề",
      sortKey: "title",
      sortValue: (t) => t.title,
      cellClassName: "max-w-xs truncate",
      cell: (t) => <span title={t.title}>{t.title}</span>,
    },
    {
      id: "category",
      header: "Loại",
      sortKey: "category",
      sortValue: (t) => CATEGORY_LABELS[t.category] ?? t.category,
      headClassName: "w-32",
      cellClassName: "text-sm text-muted-foreground",
      cell: (t) => CATEGORY_LABELS[t.category] ?? t.category,
    },
    {
      id: "status",
      header: "Trạng thái",
      sortKey: "status",
      sortValue: (t) => t.status,
      headClassName: "w-36",
      cell: (t) => <TicketStatusBadge status={t.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      sortKey: "priority",
      sortValue: (t) => t.priority ?? "",
      headClassName: "w-32",
      cell: (t) => <TicketPriorityBadge priority={t.priority} />,
    },
    {
      id: "createdAt",
      header: "Ngày tạo",
      sortKey: "createdAt",
      sortValue: (t) => new Date(t.createdAt).getTime(),
      headClassName: "w-36",
      cellClassName: "text-sm text-muted-foreground",
      cell: (t) => format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
    },
  ];

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
        <DataTable
          data={tickets}
          columns={columns}
          rowKey={(t) => t.id}
          showIndex
          pageNumber={pageNumber}
          pageSize={pageSize}
          onRowClick={(t) => navigate(`/admin/tickets/${t.id}`)}
        />
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
