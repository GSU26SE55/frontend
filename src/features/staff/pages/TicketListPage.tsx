import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import { useStaffTickets } from "@/features/staff/hooks/ticket/useStaffTickets";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { TicketCard } from "@/features/staff/components/ticket/TicketCard";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

// GH-1176: updated for 8-status canonical lifecycle visible to Staff.
const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: TicketStatusEnum.Pending, label: "Pending" },
  { value: TicketStatusEnum.InProgress, label: "In progress" },
  { value: TicketStatusEnum.Request, label: "Escalation request" },
  { value: TicketStatusEnum.Completed, label: "Completed" },
];

const DEFAULTS = {
  status: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
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
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Ticket
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">My tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} tickets &mdash;
            tickets assigned to you.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.staffTickets]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-none" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-destructive py-8">
          Couldn't load the ticket list.
        </p>
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No tickets.
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
