import { useState } from "react";
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
import DataPagination from "@/shared/components/common/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

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
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Manager &middot; Ticket
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hang cho Triage
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ticket o trang thai Open, P1 uu tien truoc.
        </p>
      </div>

      <div className="flex gap-2 items-center">
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

      <TicketTable
        tickets={data?.items ?? []}
        isLoading={isLoading}
        showTriage
        onTriage={setTriageTarget}
      />

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
