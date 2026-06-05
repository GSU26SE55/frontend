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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketDTO } from "@/shared/types/ticket.types";
import type { PaginationResponse } from "@/shared/types/api.types";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketPriorityBadge from "./TicketPriorityBadge";

interface Props {
  data?: PaginationResponse<TicketDTO>;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export default function AdminTicketTable({
  data,
  isLoading,
  page,
  onPageChange,
}: Props) {
  const navigate = useNavigate();
  const tickets = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

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
              <TableHead className="w-32">Mã</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-36">Trạng thái</TableHead>
              <TableHead className="w-32">Priority</TableHead>
              <TableHead className="w-36">Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
              >
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-1">
                    {ticket.isIncident && (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {ticket.code}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {ticket.title}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} — {data?.totalItems} ticket
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.hasPreviousPage}
              onClick={() => onPageChange(page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.hasNextPage}
              onClick={() => onPageChange(page + 1)}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
