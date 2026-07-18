import { useState } from "react";
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
import TriageDialog from "@/features/manager/components/TriageDialog";
import { useAdminTicketQueue } from "@/features/manager/hooks/useManagerTickets";
import {
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";
import type { TicketDTO } from "@/shared/types/ticket.types";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

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
  priority: "",
  category: "",
  pageNumber: 1,
  pageSize: 25,
};

export default function TicketQueuePage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const [triageTarget, setTriageTarget] = useState<TicketDTO | null>(null);

  const { data, isLoading } = useAdminTicketQueue({
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
            Hàng chờ Triage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} ticket &mdash; trạng
            thái Open, P1 ưu tiên trước.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.manager.tickets]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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
        <TicketTable
          tickets={data?.items ?? []}
          isLoading={isLoading}
          showTriage
          onTriage={setTriageTarget}
          pageNumber={filters.pageNumber}
          pageSize={filters.pageSize}
        />
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

      {triageTarget && (
        <TriageDialog
          ticketId={triageTarget.id}
          open={!!triageTarget}
          onClose={() => setTriageTarget(null)}
        />
      )}
    </div>
  );
}
