import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import type { PaginationResponse } from "@/shared/types/api.types";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DataPagination from "@/shared/components/ui/DataPagination";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import SlaCountdown from "@/shared/components/ticket/SlaCountdown";
import { getTicketSource } from "@/shared/utils/ticket/ticketSource";
import { priorityRank } from "@/shared/utils/ticket/priorityMatrix";
import { toneClass } from "@/shared/theme/statusColors";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { TICKET_CATEGORY_LABEL } from "@/shared/constants/ticketLabels";
import { formatDate } from "@/shared/utils/datetime";

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
      cellClassName: "font-mono text-xs",
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
      headClassName: "w-50",
      cellClassName: "w-50 max-w-50 font-medium",
      cell: (t) => (
        <div className="max-w-50">
          <Tooltip>
            <TooltipTrigger render={<span className="block truncate" />}>
              {t.title}
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">{t.title}</TooltipContent>
          </Tooltip>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {/* AI verify — manual tickets only, hidden when valid (hideWhenOk). */}
            <TicketVerifyBadge
              status={t.aiVerifyStatus}
              origin={t.origin}
              hideWhenOk
            />
            {/* Suspected duplicate — only while the ticket is still open. Once it is finished
                the merge decision has been made (often BY merging it), so the badge would be
                pointing at a question that is already answered. */}
            {t.suspectedDuplicateOfTicketId && isOpenTicket(t) && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Suspected duplicate
              </Badge>
            )}
            {/* Periodic maintenance badge hidden per request — logic kept intact, not removed. */}
            {t.isPeriodicMaintenance && (
              <Badge
                variant="outline"
                className={
                  "hidden " +
                  (t.isPeriodicMaintenanceOverdue
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-sky-200 bg-sky-50 text-sky-700")
                }
              >
                {t.isPeriodicMaintenanceOverdue
                  ? "Periodic · overdue"
                  : "Periodic maintenance"}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "source",
      header: "Source",
      // Không sortKey: BE whitelist sort là code|title|category|status|priority|createdAt —
      // "source" không phải cột thật nên gửi lên sẽ bị bỏ qua, để header sort được thì
      // người dùng bấm mà bảng không đổi.
      cell: (t) => {
        const source = getTicketSource(t);
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${toneClass(source.tone)}`}
          >
            {source.label}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      sortValue: (t) => t.status,
      cell: (t) => <TicketStatusBadge status={t.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      sortKey: "priority",
      // Rank, not the enum string: a plain string compare sorts "Urgent" last,
      // burying the most severe ticket. See priorityRank.
      sortValue: (t) => priorityRank(t.priority),
      cell: (t) => <TicketPriorityBadge priority={t.priority} />,
    },
    {
      id: "category",
      header: "Category",
      sortKey: "category",
      sortValue: (t) => TICKET_CATEGORY_LABEL[t.category] ?? t.category,
      cellClassName: "text-sm text-muted-foreground",
      cell: (t) => TICKET_CATEGORY_LABEL[t.category] ?? t.category,
    },
    {
      // Ticket có 2 SLA riêng: Response chạy ở stage Open, Resolution chạy từ InProgress.
      // Tách 2 cột để thấy rõ mốc nào đang đếm — cột chưa bắt đầu hiện "Not started".
      id: "slaResponse",
      header: TABLE_COLUMNS.slaResponse,
      stopRowClick: true,
      cell: (t) => (
        <SlaCountdown
          slaTimer={t.responseSlaTimer}
          compact
          completedAt={t.status !== TicketStatusEnum.Open ? t.updatedAt : null}
        />
      ),
    },
    {
      id: "slaResolve",
      header: TABLE_COLUMNS.slaResolve,
      stopRowClick: true,
      cell: (t) => (
        <SlaCountdown
          slaTimer={t.resolutionSlaTimer}
          compact
          // `resolvedAt`/`closedAt` chỉ có trên TicketDetailDTO, không có trên DTO của danh
          // sách mà bảng này render — nên mốc gần đúng duy nhất còn lại là `updatedAt`, đúng
          // như cột SLA response ngay bên trên đang dùng.
          completedAt={
            t.status === TicketStatusEnum.Completed ||
            t.status === TicketStatusEnum.Closed ||
            t.status === TicketStatusEnum.ClosedRejected
              ? t.updatedAt
              : null
          }
        />
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      sortValue: (t) => new Date(t.createdAt).getTime(),
      cellClassName: "text-xs text-muted-foreground",
      cell: (t) => formatDate(t.createdAt),
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
