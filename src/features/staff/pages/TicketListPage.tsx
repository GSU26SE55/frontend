import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketStatusEnum } from "@/shared/types/ticket.types";
import { useStaffTickets } from "../hooks/useStaffTickets";
import { TicketCard } from "../components/TicketCard";

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: TicketStatusEnum.Assigned, label: "Đã gán" },
  { value: TicketStatusEnum.InProgress, label: "Đang xử lý" },
  { value: TicketStatusEnum.WaitingCustomer, label: "Chờ khách hàng" },
  { value: TicketStatusEnum.WaitingParts, label: "Chờ linh kiện" },
  { value: TicketStatusEnum.WaitingOnsiteSchedule, label: "Chờ lịch hẹn" },
  { value: TicketStatusEnum.Resolved, label: "Đã xử lý" },
  { value: TicketStatusEnum.Escalated, label: "Đã chuyển cấp" },
];

const PAGE_SIZE = 10;

export default function TicketListPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useStaffTickets({
    status: (statusFilter as TicketStatusEnum | undefined) || undefined,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value ?? "");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ticket của tôi</h1>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-destructive py-8">
          Không thể tải danh sách ticket.
        </p>
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Không có ticket nào.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
