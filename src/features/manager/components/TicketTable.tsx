import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import SlaCountdown from "./SlaCountdown";
import type { TicketDTO } from "@/shared/types/ticket.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

interface Props {
  tickets: TicketDTO[];
  isLoading: boolean;
  showTriage?: boolean;
  onTriage?: (ticket: TicketDTO) => void;
  pageNumber?: number;
  pageSize?: number;
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
}: Props) {
  const navigate = useNavigate();
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<TicketDTO>(tickets, (t, key) => {
      switch (key) {
        case "code":
          return t.code;
        case "title":
          return t.title;
        case "status":
          return t.status;
        case "priority":
          return t.priority ?? "";
        case "category":
          return CATEGORY_LABEL[t.category] ?? t.category;
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
      <div className="py-12 text-center text-sm text-muted-foreground">
        Không có ticket nào
      </div>
    );
  }

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">STT</TableHead>
            <SortableTableHead
              sortKey="code"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
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
              sortKey="status"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Trạng thái
            </SortableTableHead>
            <SortableTableHead
              sortKey="priority"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Priority
            </SortableTableHead>
            <SortableTableHead
              sortKey="category"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Loại
            </SortableTableHead>
            <TableHead>SLA</TableHead>
            <SortableTableHead
              sortKey="createdAt"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Tạo lúc
            </SortableTableHead>
            {showTriage && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((ticket, index) => (
            <TableRow
              key={ticket.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/manager/tickets/${ticket.id}`)}
            >
              <TableCell className="text-center text-muted-foreground tabular-nums">
                {(pageNumber - 1) * pageSize + index + 1}
              </TableCell>
              <TableCell className="font-mono text-xs">{ticket.code}</TableCell>
              <TableCell
                className="max-w-xs truncate font-medium"
                title={ticket.title}
              >
                {ticket.title}
              </TableCell>
              <TableCell>
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <TicketPriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {CATEGORY_LABEL[ticket.category] ?? ticket.category}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <SlaCountdown slaTimer={ticket.slaTimer} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
              </TableCell>
              {showTriage && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button
                    className="rounded border px-2 py-1 text-xs hover:bg-muted"
                    onClick={() => onTriage?.(ticket)}
                  >
                    Triage
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
