import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import { Badge } from "@/components/ui/badge";
import SlaCountdown from "./SlaCountdown";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  tickets: TicketDTO[];
  isLoading: boolean;
  showTriage?: boolean;
  onTriage?: (ticket: TicketDTO) => void;
  pageNumber?: number;
  pageSize?: number;
  /**
   * Sort server-side — state từ useUrlSort. Chỉ phần list (AdminTicketListParams)
   * truyền; queue (AdminTicketQueueParams không có sort) bỏ qua → sort tĩnh.
   */
  sort?: ServerSortState;
}

const CATEGORY_LABEL: Record<string, string> = {
  Charging: "Sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
  Repair: "Sửa chữa",
  Other: "Khác",
};

export default function TicketTable({
  tickets,
  isLoading,
  showTriage,
  onTriage,
  pageNumber = 1,
  pageSize = 0,
  sort,
}: Props) {
  const navigate = useNavigate();

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
      <div className="py-12 text-center text-sm text-muted-foreground">
        Không có ticket nào
      </div>
    );
  }

  const columns: ColumnDef<TicketDTO>[] = [
    {
      id: "code",
      header: "Mã",
      sortKey: "code",
      sortValue: (t) => t.code,
      cellClassName: "font-mono text-xs",
      cell: (t) => t.code,
    },
    {
      id: "title",
      header: "Tiêu đề",
      sortKey: "title",
      sortValue: (t) => t.title,
      cellClassName: "max-w-xs font-medium",
      cell: (t) => (
        <div className="max-w-xs">
          <span title={t.title} className="block truncate">
            {t.title}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {/* AI verify — chỉ ticket manual, ẩn khi hợp lệ (hideWhenOk). */}
            <TicketVerifyBadge
              status={t.aiVerifyStatus}
              origin={t.origin}
              hideWhenOk
            />
            {/* Nghi trùng với ticket đang mở. */}
            {t.suspectedDuplicateOfTicketId && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700"
              >
                Nghi trùng
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      sortKey: "status",
      sortValue: (t) => t.status,
      cell: (t) => <TicketStatusBadge status={t.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      sortKey: "priority",
      sortValue: (t) => t.priority ?? "",
      cell: (t) => <TicketPriorityBadge priority={t.priority} />,
    },
    {
      id: "category",
      header: "Loại",
      sortKey: "category",
      sortValue: (t) => CATEGORY_LABEL[t.category] ?? t.category,
      cellClassName: "text-sm text-muted-foreground",
      cell: (t) => CATEGORY_LABEL[t.category] ?? t.category,
    },
    {
      id: "sla",
      header: TABLE_COLUMNS.sla,
      stopRowClick: true,
      cell: (t) => <SlaCountdown slaTimer={t.slaTimer} />,
    },
    {
      id: "createdAt",
      header: "Tạo lúc",
      sortKey: "createdAt",
      sortValue: (t) => new Date(t.createdAt).getTime(),
      cellClassName: "text-xs text-muted-foreground",
      cell: (t) => new Date(t.createdAt).toLocaleDateString("vi-VN"),
    },
  ];

  if (showTriage) {
    columns.push({
      id: "triage",
      header: "",
      stopRowClick: true,
      cell: (t) => (
        <button
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => onTriage?.(t)}
        >
          Triage
        </button>
      ),
    });
  }

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <DataTable
        data={tickets}
        columns={columns}
        rowKey={(t) => t.id}
        showIndex
        pageNumber={pageNumber}
        pageSize={pageSize}
        onRowClick={(t) => navigate(`/manager/tickets/${t.id}`)}
        serverSort={sort}
      />
    </Card>
  );
}
