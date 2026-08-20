import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import { Badge } from "@/components/ui/badge";
import SlaCountdown from "./SlaCountdown";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
import {
  TicketStatusEnum,
  TicketOriginEnum,
} from "@/shared/enums/ticket/ticket.enum";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  tickets: TicketDTO[];
  isLoading: boolean;
  // GH-1176: showTriage/onTriage removed (triage approval removed).
  onReprioritize?: (ticket: TicketDTO) => void;
  pageNumber?: number;
  pageSize?: number;
  /**
   * Server-side sort — state from useUrlSort. Only passed by the list view
   * (AdminTicketListParams); the queue (AdminTicketQueueParams has no sort) skips it → static sort.
   */
  sort?: ServerSortState;
  /**
   * Base path for the row-click detail link. Defaults to the "Tickets" list route;
   * the Queue page passes "/manager/tickets/queue" so Back returns to the Queue instead.
   */
  detailBasePath?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  Charging: "Charging",
  Overheat: "Overheat",
  NoPower: "No power",
  Performance: "Performance",
  Repair: "Repair",
  Other: "Other",
};

export default function TicketTable({
  tickets,
  isLoading,
  onReprioritize,
  pageNumber = 1,
  pageSize = 0,
  sort,
  detailBasePath = "/manager/tickets",
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
        No tickets
      </div>
    );
  }

  const columns: ColumnDef<TicketDTO>[] = [
    {
      id: "code",
      header: "Code",
      sortKey: "code",
      sortValue: (t) => t.code,
      cellClassName: "font-mono text-xs",
      cell: (t) => t.code,
    },
    {
      id: "title",
      header: "Title",
      sortKey: "title",
      sortValue: (t) => t.title,
      cellClassName: "max-w-xs font-medium",
      cell: (t) => (
        <div className="max-w-xs">
          <span title={t.title} className="block truncate">
            {t.title}
          </span>
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
            {t.isPeriodicMaintenance && (
              <Badge
                variant="outline"
                className={
                  t.isPeriodicMaintenanceOverdue
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-sky-200 bg-sky-50 text-sky-700"
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
      sortValue: (t) => t.priority ?? "",
      // Auto tickets not yet assigned to Staff: priority is inferred by AI from the anomaly
      // category and hasn't gone through a reviewer. Flag it so Manager doesn't mistake it
      // for a priority someone has already signed off on.
      cell: (t) => (
        <div className="flex flex-wrap items-center gap-1">
          <TicketPriorityBadge priority={t.priority} />
          {t.origin === TicketOriginEnum.AutoFromAlert &&
            t.status === TicketStatusEnum.Open && (
              <Badge
                variant="outline"
                className="border-violet-200 bg-violet-50 text-violet-700"
                title="Priority suggested by AI from the alert — not yet approved by Manager"
              >
                AI suggested
              </Badge>
            )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
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
      header: "Created",
      sortKey: "createdAt",
      sortValue: (t) => new Date(t.createdAt).getTime(),
      cellClassName: "text-xs text-muted-foreground",
      cell: (t) => new Date(t.createdAt).toLocaleDateString("vi-VN"),
    },
  ];

  // GH-1176: triage approval removed; queue shows Open tickets with reprioritize action only.
  if (onReprioritize) {
    columns.push({
      id: "triage",
      header: "",
      stopRowClick: true,
      cell: (t) =>
        onReprioritize ? (
          <button
            className="rounded border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => onReprioritize(t)}
          >
            Review priority
          </button>
        ) : null,
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
        onRowClick={(t) => navigate(`${detailBasePath}/${t.id}`)}
        serverSort={sort}
      />
    </Card>
  );
}
