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
import TicketStatusBadge from "./TicketStatusBadge";
import TicketPriorityBadge from "./TicketPriorityBadge";
import SlaCountdown from "./SlaCountdown";
import type { TicketDTO } from "@/shared/types/ticket.types";

interface Props {
  tickets: TicketDTO[];
  isLoading: boolean;
  showTriage?: boolean;
  onTriage?: (ticket: TicketDTO) => void;
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã</TableHead>
          <TableHead>Tiêu đề</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead>Tạo lúc</TableHead>
          {showTriage && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow
            key={ticket.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/manager/tickets/${ticket.id}`)}
          >
            <TableCell className="font-mono text-xs">{ticket.code}</TableCell>
            <TableCell className="max-w-xs truncate font-medium">
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
  );
}
