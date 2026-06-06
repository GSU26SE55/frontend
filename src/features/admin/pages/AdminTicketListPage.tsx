import { useState } from "react";
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
import type { GetAdminTicketsParams } from "../services/ticket.service";
import { useAdminTickets } from "../hooks/useAdminTickets";
import AdminTicketTable from "../components/AdminTicketTable";

const PAGE_SIZE = 20;

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
  Repair: "Sửa chữa",
  Other: "Khác",
};

const STATUS_ITEMS: Record<string, string> = {
  "": "Tất cả trạng thái",
  ...Object.fromEntries(STATUS_OPTIONS.map((s) => [s, STATUS_LABELS[s]])),
};
const PRIORITY_ITEMS: Record<string, string> = {
  "": "Tất cả priority",
  ...Object.fromEntries(PRIORITY_OPTIONS.map((p) => [p, PRIORITY_LABELS[p]])),
};
const CATEGORY_ITEMS: Record<string, string> = {
  "": "Tất cả loại",
  ...Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c, CATEGORY_LABELS[c]])),
};

interface FilterState extends GetAdminTicketsParams {
  pageNumber: number;
  pageSize: number;
}

const INITIAL: FilterState = { pageNumber: 1, pageSize: PAGE_SIZE };

export default function AdminTicketListPage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL);

  const { data, isLoading } = useAdminTickets(filters);

  function setFilter<K extends keyof FilterState>(
    key: K,
    value: FilterState[K] | undefined,
  ) {
    setFilters((prev) => ({ ...prev, [key]: value, pageNumber: 1 }));
  }

  function handleReset() {
    setFilters(INITIAL);
  }

  const hasActiveFilter = !!(
    filters.keyword ||
    filters.status ||
    filters.priority ||
    filters.category
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Quản lý Ticket</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Tìm theo mã hoặc tiêu đề..."
          value={filters.keyword ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilter("keyword", e.target.value || undefined)
          }
          className="w-64"
        />

        <Select
          value={filters.status ?? ""}
          items={STATUS_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("status", (v as TicketStatus) || undefined)
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="">Tất cả trạng thái</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? ""}
          items={PRIORITY_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("priority", (v as TicketPriority) || undefined)
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="">Tất cả priority</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category ?? ""}
          items={CATEGORY_ITEMS}
          onValueChange={(v: string | null) =>
            setFilter("category", (v as TicketCategory) || undefined)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="">Tất cả loại</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" onClick={handleReset}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <AdminTicketTable
        data={data}
        isLoading={isLoading}
        page={filters.pageNumber}
        onPageChange={(p) => setFilters((prev) => ({ ...prev, pageNumber: p }))}
      />
    </div>
  );
}
