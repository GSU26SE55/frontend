import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import type { PaginationResponse } from "@/shared/types/api.types";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import DataPagination from "@/shared/components/ui/DataPagination";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import SlaCountdown from "@/shared/components/ticket/SlaCountdown";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { TICKET_CATEGORY_LABEL } from "@/shared/constants/ticketLabels";

interface Props {
  data?: PaginationResponse<TicketDTO>;
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Server-side sort — state from useUrlSort. */
  sort: ServerSortState;
}

export default function AdminTicketTable({
  data,
  isLoading,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
}: Props) {
  const navigate = useNavigate();
  const tickets = data?.items ?? [];

  const columns: ColumnDef<TicketDTO>[] = [
    {
      id: "code",
      header: "Code",
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
      header: "Title",
      sortKey: "title",
      sortValue: (t) => t.title,
      cellClassName: "max-w-xs truncate",
      cell: (t) => <span title={t.title}>{t.title}</span>,
    },
    {
      id: "status",
      header: "Status",
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
      id: "category",
      header: "Category",
      sortKey: "category",
      sortValue: (t) => TICKET_CATEGORY_LABEL[t.category] ?? t.category,
      headClassName: "w-32",
      cellClassName: "text-sm text-muted-foreground",
      cell: (t) => TICKET_CATEGORY_LABEL[t.category] ?? t.category,
    },
    {
      id: "sla",
      header: TABLE_COLUMNS.sla,
      headClassName: "w-24",
      stopRowClick: true,
      cell: (t) => <SlaCountdown slaTimer={t.slaTimer} compact />,
    },
    {
      id: "createdAt",
      header: "Created",
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
        <p>No tickets found.</p>
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
          serverSort={sort}
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
