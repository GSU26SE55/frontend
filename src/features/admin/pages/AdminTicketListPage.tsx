import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";
import type {
  TicketStatusEnum as TicketStatus,
  TicketPriorityEnum as TicketPriority,
  TicketCategoryEnum as TicketCategory,
} from "@/shared/types/ticket.types";
import { useAdminTickets } from "../hooks/useAdminTickets";
import AdminTicketTable from "../components/AdminTicketTable";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { Card } from "@/components/ui/card";
import { KEY } from "@/shared/utils/queryKeys";
import { loadFailed } from "@/shared/constants/emptyStates";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = Object.values(TicketStatusEnum) as TicketStatus[];
const PRIORITY_OPTIONS = Object.values(TicketPriorityEnum) as TicketPriority[];
const CATEGORY_OPTIONS = Object.values(TicketCategoryEnum) as TicketCategory[];

const STATUS_LABELS: Record<TicketStatus, string> = {
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

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  P1Critical: "P1 Critical",
  P2High: "P2 High",
  P3Normal: "P3 Normal",
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  Charging: "Lỗi sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
  Other: "Khác",
  Repair: "Sửa chữa",
};

const DEFAULTS = {
  keyword: "",
  status: "",
  priority: "",
  category: "",
  pageNumber: 1,
  pageSize: PAGE_SIZE,
};

export default function AdminTicketListPage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );

  const params = {
    keyword: filters.keyword || undefined,
    status: (filters.status as TicketStatus) || undefined,
    priority: (filters.priority as TicketPriority) || undefined,
    category: (filters.category as TicketCategory) || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  };

  const { data, isLoading, isError, refetch } = useAdminTickets(params);

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Ticket
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Danh sách ticket
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} ticket &mdash; theo
            dõi toàn bộ ticket hệ thống.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.admin.tickets]} />
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
          items={STATUS_OPTIONS.map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
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
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || null}
          items={PRIORITY_OPTIONS.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
          }))}
          onValueChange={(v: string | null) =>
            setFilter("priority", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Tất cả priority" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>Tất cả priority</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || null}
          items={CATEGORY_OPTIONS.map((c) => ({
            value: c,
            label: CATEGORY_LABELS[c],
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
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
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

      {isError ? (
        <Card className="gap-0 py-0 overflow-hidden">
          <ErrorState
            message={loadFailed("ticket")}
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <AdminTicketTable
          data={data}
          isLoading={isLoading}
          pageNumber={filters.pageNumber}
          pageSize={filters.pageSize}
          onPageChange={(p) => setFilter("pageNumber", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
        />
      )}
    </div>
  );
}
