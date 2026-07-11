import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { KEY } from "@/shared/utils/queryKeys";

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

const CATEGORY_LABELS: Record<string, string> = {
  Maintenance: "Bảo trì",
  Repair: "Sửa chữa",
  Inspection: "Kiểm tra",
  Emergency: "Khẩn cấp",
  Replacement: "Thay thế",
  Upgrade: "Nâng cấp",
  Other: "Khác",
  Charging: "Lỗi sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
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
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  const { data, isLoading, isError, refetch } = useAdminTicketList({
    keyword: filters.keyword || undefined,
    status: (filters.status as TicketStatusEnum) || undefined,
    priority: (filters.priority as TicketPriorityEnum) || undefined,
    category: (filters.category as TicketCategoryEnum) || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  });

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Manager &middot; Ticket
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý ticket
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} ticket &mdash; theo
            dõi và điều phối ticket
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.manager.tickets]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hoặc tiêu đề..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.status || null}
          items={Object.values(TicketStatusEnum).map((s) => ({
            value: s,
            label: STATUS_LABELS[s] ?? s,
          }))}
          onValueChange={(v: string | null) =>
            setFilter("status", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-44">
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
          items={[
            { value: TicketPriorityEnum.P1Critical, label: "P1 Critical" },
            { value: TicketPriorityEnum.P2High, label: "P2 High" },
            { value: TicketPriorityEnum.P3Normal, label: "P3 Normal" },
          ]}
          onValueChange={(v: string | null) =>
            setFilter("priority", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-36">
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
          items={Object.values(TicketCategoryEnum).map((c) => ({
            value: c,
            label: CATEGORY_LABELS[c] ?? c,
          }))}
          onValueChange={(v: string | null) =>
            setFilter("category", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả loại</SelectItem>
            {Object.values(TicketCategoryEnum).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isError ? (
          <ErrorState
            message="Không thể tải danh sách ticket."
            onRetry={() => refetch()}
          />
        ) : (
          <TicketTable
            tickets={data?.items ?? []}
            isLoading={isLoading}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
          />
        )}
      </Card>

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
