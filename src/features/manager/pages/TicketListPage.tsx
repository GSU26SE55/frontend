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
import TicketTable from "@/features/manager/components/ticket/TicketTable";
import { useAdminTicketList } from "@/features/manager/hooks/ticket/useManagerTickets";
import {
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket/ticket.types";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { KEY } from "@/shared/utils/queryKeys";
import { loadFailed } from "@/shared/constants/emptyStates";

const STATUS_LABELS: Record<string, string> = {
  New: "New",
  Open: "Open",
  Approved: "Approved",
  Assigned: "Assigned",
  InProgress: "In progress",
  WaitingCustomer: "Waiting on customer",
  WaitingParts: "Waiting on parts",
  WaitingOnsiteSchedule: "Waiting on schedule",
  Resolved: "Resolved",
  Escalated: "Escalated",
  ClosedPendingRate: "Awaiting rating",
  Closed: "Closed",
  ClosedRejected: "Rejected",
  Incident: "Incident",
};

const CATEGORY_LABELS: Record<string, string> = {
  Maintenance: "Maintenance",
  Repair: "Repair",
  Inspection: "Inspection",
  Emergency: "Emergency",
  Replacement: "Replacement",
  Upgrade: "Upgrade",
  Other: "Other",
  Charging: "Charging fault",
  Overheat: "Overheat",
  NoPower: "No power",
  Performance: "Performance",
};

const DEFAULTS = {
  keyword: "",
  status: "",
  priority: "",
  category: "",
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 25,
};

export default function TicketListPage() {
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);

  const { data, isLoading, isError, refetch } = useAdminTicketList({
    keyword: filters.keyword || undefined,
    status: (filters.status as TicketStatusEnum) || undefined,
    priority: (filters.priority as TicketPriorityEnum) || undefined,
    category: (filters.category as TicketCategoryEnum) || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
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
            Ticket Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} tickets &mdash; track
            and coordinate tickets.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.manager.tickets]} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code or title..."
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
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All statuses</SelectItem>
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
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All priorities</SelectItem>
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
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={null}>All categories</SelectItem>
            {Object.values(TicketCategoryEnum).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
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
        {isError ? (
          <ErrorState
            message={loadFailed("ticket")}
            onRetry={() => refetch()}
          />
        ) : (
          <TicketTable
            tickets={data?.items ?? []}
            isLoading={isLoading}
            pageNumber={filters.pageNumber}
            pageSize={filters.pageSize}
            sort={sort}
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
