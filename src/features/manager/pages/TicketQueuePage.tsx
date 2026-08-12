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
import TicketTable from "@/features/manager/components/ticket/TicketTable";
// GH-1176: TriageDialog (approval) removed; queue shows Open tickets awaiting assignment.
import ReprioritizeDialog from "@/features/manager/components/ticket/ReprioritizeDialog";
import { useAdminTicketQueue } from "@/features/manager/hooks/ticket/useManagerTickets";
import {
  TicketPriorityEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket/ticket.types";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

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
  priority: "",
  category: "",
  pageNumber: 1,
  pageSize: 25,
};

export default function TicketQueuePage() {
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  // GH-1176: triageTarget removed (triage approval removed; queue is Open tickets only).
  const [reprioritizeTarget, setReprioritizeTarget] =
    useState<TicketDTO | null>(null);

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
            Triage Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} tickets awaiting a
            priority decision &mdash; review the priority and assign Staff.
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
        <TicketTable
          tickets={data?.items ?? []}
          isLoading={isLoading}
          onReprioritize={setReprioritizeTarget}
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

      {reprioritizeTarget && (
        <ReprioritizeDialog
          ticketId={reprioritizeTarget.id}
          currentImpact={reprioritizeTarget.impactScope}
          currentUrgency={reprioritizeTarget.urgencyLevel}
          open={!!reprioritizeTarget}
          onClose={() => setReprioritizeTarget(null)}
        />
      )}
    </div>
  );
}
