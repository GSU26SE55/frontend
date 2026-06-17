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
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { TicketCard } from "../components/TicketCard";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: TicketStatusEnum.Assigned, label: "Đã gán" },
  { value: TicketStatusEnum.InProgress, label: "Đang xử lý" },
  { value: TicketStatusEnum.WaitingCustomer, label: "Chờ khách hàng" },
  { value: TicketStatusEnum.WaitingParts, label: "Chờ linh kiện" },
  { value: TicketStatusEnum.WaitingOnsiteSchedule, label: "Chờ lịch hẹn" },
  { value: TicketStatusEnum.Resolved, label: "Đã xử lý" },
  { value: TicketStatusEnum.Escalated, label: "Đã chuyển cấp" },
];

const DEFAULTS = {
  status: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function TicketListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const { data, isLoading, isError } = useStaffTickets({
    status: (filters.status as TicketStatusEnum) || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Ticket
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ticket cua toi
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton queryKeys={[KEY.staffTickets]} size="icon" />
        <Select
          value={filters.status || null}
          items={STATUS_FILTER_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả trạng thái</SelectItem>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          {hasActiveFilter && (
            <Button variant="ghost" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
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

          <DataPagination
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            hasNextPage={data.hasNextPage}
            hasPreviousPage={data.hasPreviousPage}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            onPageChange={(p) => setFilter("pageNumber", p)}
            onPageSizeChange={(s) => setFilter("pageSize", s)}
          />
        </>
      )}
    </div>
  );
}
