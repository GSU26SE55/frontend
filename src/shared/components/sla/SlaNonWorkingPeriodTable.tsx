import { EllipsisVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { ACTIONS } from "@/shared/constants/actions";
import { todayIsoDate } from "@/shared/schemas/sla/sla-calendar.schema";
import type { SlaNonWorkingPeriodDto } from "@/shared/types/sla/sla-calendar.types";

const fmt = (iso: string) => {
  try {
    return format(parseISO(iso.slice(0, 10)), "dd/MM/yyyy");
  } catch {
    return iso;
  }
};

/** Inclusive day count — a single-day holiday reads as 1 day, not 0. */
const dayCount = (startDate: string, endDate: string) => {
  const start = parseISO(startDate.slice(0, 10)).getTime();
  const end = parseISO(endDate.slice(0, 10)).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
};

interface Props {
  items: SlaNonWorkingPeriodDto[];
  pageNumber?: number;
  pageSize?: number;
  onEdit: (period: SlaNonWorkingPeriodDto) => void;
  onDelete: (period: SlaNonWorkingPeriodDto) => void;
}

export default function SlaNonWorkingPeriodTable({
  items,
  pageNumber,
  pageSize,
  onEdit,
  onDelete,
}: Props) {
  const today = todayIsoDate();

  const columns: ColumnDef<SlaNonWorkingPeriodDto>[] = [
    {
      id: "startDate",
      header: "From",
      sortKey: "startDate",
      sortValue: (p) => p.startDate,
      cell: (p) => fmt(p.startDate),
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "endDate",
      header: "To",
      sortKey: "endDate",
      sortValue: (p) => p.endDate,
      cell: (p) => fmt(p.endDate),
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "days",
      header: "Days",
      sortKey: "days",
      sortValue: (p) => dayCount(p.startDate, p.endDate),
      cell: (p) => (
        <Badge variant="secondary" className="text-3xs">
          {dayCount(p.startDate, p.endDate)}
        </Badge>
      ),
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "reason",
      header: "Reason",
      sortKey: "reason",
      sortValue: (p) => p.reason,
      cell: (p) => (
        <span className="flex items-center gap-2">
          <span className="line-clamp-2">{p.reason}</span>
          {p.startDate.slice(0, 10) < today && (
            <span className="text-2xs text-muted-foreground shrink-0">
              (past)
            </span>
          )}
        </span>
      ),
      cellClassName: "max-w-md",
    },
    {
      id: "actions",
      header: TABLE_COLUMNS.actions,
      headClassName: "text-right",
      cellClassName: "text-right",
      stopRowClick: true,
      cell: (p) => {
        // The BE rejects any write whose start date is in the past — on edit too
        // (ValidateStartDate runs for both commands), so offering Edit on a period that has
        // already started would just hand the user a 400. Delete has no such check.
        const isPast = p.startDate.slice(0, 10) < today;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-7" />}
              aria-label={`Actions for ${p.reason}`}
            >
              <EllipsisVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem disabled={isPast} onClick={() => onEdit(p)}>
                {ACTIONS.EDIT}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(p)}
              >
                {ACTIONS.DELETE}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      rowKey={(p) => p.id}
      showIndex
      pageNumber={pageNumber}
      pageSize={pageSize}
    />
  );
}
