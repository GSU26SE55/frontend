import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TicketTable from "@/features/manager/components/TicketTable";
import { useAdminTicketList } from "@/features/manager/hooks/useManagerTickets";
import {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const STATUS_LABELS: Record<string, string> = {
  New: "Mới",
  Open: "Đang mở",
  Approved: "Đã duyệt",
  Assigned: "Đã gán",
  InProgress: "Đang xử lý",
  WaitingCustomer: "Chờ khách hàng",
  WaitingParts: "Chờ linh kiện",
  WaitingOnsiteSchedule: "Chờ lịch hẹn",
  Resolved: "Đã giải quyết",
  Escalated: "Chuyển cấp",
  ClosedPendingRate: "Chờ đánh giá",
  Closed: "Đã đóng",
  ClosedRejected: "Từ chối đóng",
  Incident: "Sự cố",
};

const DEFAULTS = {
  keyword: "",
  status: "",
  priority: "",
  category: "",
  pageNumber: 1,
  pageSize: 25,
};

export default function TicketListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const { data, isLoading } = useAdminTicketList({
    keyword: filters.keyword || undefined,
    status: (filters.status as TicketStatusEnum) || undefined,
    priority: (filters.priority as TicketPriorityEnum) || undefined,
    category: (filters.category as TicketCategoryEnum) || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Manager &middot; Ticket
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Quản lý ticket
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Tìm theo mã hoặc tiêu đề..."
          value={filters.keyword}
          onChange={(e) => setFilter("keyword", e.target.value || undefined)}
          className="w-64"
        />

        <Select
          value={filters.status || null}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả trạng thái</SelectItem>
            {Object.values(TicketStatusEnum).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || null}
          onValueChange={(v: string | null) =>
            setFilter("priority", v || undefined)
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tất cả priority" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả priority</SelectItem>
            <SelectItem value={TicketPriorityEnum.P1Critical}>
              P1 Critical
            </SelectItem>
            <SelectItem value={TicketPriorityEnum.P2High}>P2 High</SelectItem>
            <SelectItem value={TicketPriorityEnum.P3Normal}>
              P3 Normal
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category || null}
          onValueChange={(v: string | null) =>
            setFilter("category", v || undefined)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả loại</SelectItem>
            {Object.values(TicketCategoryEnum).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
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

      <TicketTable tickets={data?.items ?? []} isLoading={isLoading} />

      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />
    </div>
  );
}
