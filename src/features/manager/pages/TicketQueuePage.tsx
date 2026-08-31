import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TicketTable from "@/features/manager/components/ticket/TicketTable";
// GH-1176: TriageDialog (approval) removed; queue shows Open tickets awaiting assignment.
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";
import {
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket/ticket.types";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { TICKET_CATEGORY_LABEL } from "@/shared/constants/ticketLabels";

const DEFAULTS = {
  priority: "",
  category: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export default function TicketQueuePage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  // GH-1176: triageTarget removed (triage approval removed; queue is Open tickets only).

  const { data, isLoading } = useAdminTicketQueue({
    priority: (filters.priority as TicketPriorityEnum) || undefined,
    category: (filters.category as TicketCategoryEnum) || undefined,
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
  });

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Manager &middot; Ticket
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} ticket
            {isLoading || data?.totalItems === 1 ? "" : "s"}
            {hasActiveFilter ? " matching the current filters" : ""} awaiting a
            priority decision &mdash; review the priority and assign Staff.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.manager.tickets]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.priority || null}
          items={[
            { value: TicketPriorityEnum.Urgent, label: "Urgent" },
            { value: TicketPriorityEnum.P1Critical, label: "P1 Critical" },
            { value: TicketPriorityEnum.P2High, label: "P2 High" },
            { value: TicketPriorityEnum.P3Normal, label: "P3 Normal" },
          ]}
          onValueChange={(v: string | null) =>
            setFilter("priority", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All priorities</SelectItem>
            {/* Urgent outranks P1 — it was missing here, so the most severe tickets
                could not be filtered for at all. */}
            <SelectItem value={TicketPriorityEnum.Urgent}>Urgent</SelectItem>
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
            label: TICKET_CATEGORY_LABEL[c] ?? c,
          }))}
          onValueChange={(v: string | null) =>
            setFilter("category", v || undefined)
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All categories</SelectItem>
            {Object.values(TicketCategoryEnum).map((c) => (
              <SelectItem key={c} value={c}>
                {TICKET_CATEGORY_LABEL[c] ?? c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <TicketTable
          tickets={data?.items ?? []}
          isLoading={isLoading}
          pageNumber={filters.pageNumber}
          pageSize={filters.pageSize}
          // The BE returns the queue in the order it must be worked (Urgent → P1 → P2 → P3,
          // then oldest first). The queue endpoint takes no sort params, so leave the order alone.
          disableSort
          detailBasePath="/manager/tickets/queue"
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
    </PageContainer>
  );
}
