import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useBatteryAuditLogs } from "@/features/admin/hooks/battery/useBatteryAuditLogs";
import { useAlertAuditLogs } from "@/features/admin/hooks/ticket/useAlertAuditLogs";
import BatteryAuditLogTable from "@/features/admin/components/battery/BatteryAuditLogTable";
import AuditLogFilterBar, {
  type AuditLogFilterValues,
} from "@/features/admin/components/account/AuditLogFilterBar";
import {
  BatteryAuditActionCode,
  AlertAuditActionCode,
} from "@/features/admin/enums/battery-audit.enum";
import type { BatteryAuditLogDto } from "@/features/admin/types/battery/battery-audit.types";
import type { PaginationResponse } from "@/shared/types/api.types";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import type { SortDirection } from "@/shared/hooks/useSortableData";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

// YYYY-MM-DD → UTC range (BE filter from/to).
const toUtcStart = (d?: string) => (d ? `${d}T00:00:00Z` : undefined);
const toUtcEnd = (d?: string) => (d ? `${d}T23:59:59Z` : undefined);

interface AuditPanelProps {
  data: PaginationResponse<BatteryAuditLogDto> | undefined;
  isLoading: boolean;
  isError: boolean;
  filters: AuditLogFilterValues;
  onFilterChange: <K extends keyof AuditLogFilterValues>(
    key: K,
    value: AuditLogFilterValues[K],
  ) => void;
  onReset: () => void;
  actionOptions: string[];
  targetLabel: string;
  sort: ServerSortState;
  pageNumber: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function AuditPanel({
  data,
  isLoading,
  isError,
  filters,
  onFilterChange,
  onReset,
  actionOptions,
  targetLabel,
  sort,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AuditPanelProps) {
  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0 overflow-hidden">
        <AuditLogFilterBar
          values={filters}
          onChange={onFilterChange}
          onReset={onReset}
          actionOptions={actionOptions}
          targetLabel={targetLabel}
        />
        <BatteryAuditLogTable
          logs={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          pageNumber={pageNumber}
          pageSize={pageSize}
          sort={sort}
        />
      </Card>
      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function useAuditTabState() {
  const [filters, setFilters] = useState<AuditLogFilterValues>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const onFilterChange = <K extends keyof AuditLogFilterValues>(
    key: K,
    value: AuditLogFilterValues[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPageNumber(1);
  };
  const onReset = () => {
    setFilters({});
    setPageNumber(1);
  };

  // Server-side sort: toggle asc → desc → clear, reset to page 1 when the sort changes.
  const toggleSort = (key: string) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null);
      setSortDir("asc");
    }
    setPageNumber(1);
  };
  const setSort = (key: string | null, dir: SortDirection) => {
    setSortBy(key);
    setSortDir(dir);
    setPageNumber(1);
  };
  const sort: ServerSortState = { sortBy, sortDir, toggleSort, setSort };

  return {
    filters,
    onFilterChange,
    onReset,
    sort,
    sortBy,
    sortDir,
    pageNumber,
    pageSize,
    setPageNumber,
    setPageSize,
  };
}

// Only call the API when the range is valid (blocks a 422 for from > to before calling).
const rangeValid = (f: AuditLogFilterValues) =>
  !(f.dateFrom && f.dateTo && f.dateFrom > f.dateTo);

function BatteryAuditTab() {
  const s = useAuditTabState();
  const { data, isLoading, isError } = useBatteryAuditLogs(
    {
      action: s.filters.action,
      batteryId: s.filters.target,
      from: toUtcStart(s.filters.dateFrom),
      to: toUtcEnd(s.filters.dateTo),
      sortBy: s.sortBy || undefined,
      sortDir: s.sortBy ? s.sortDir : undefined,
      pageNumber: s.pageNumber,
      pageSize: s.pageSize,
    },
    rangeValid(s.filters),
  );

  return (
    <AuditPanel
      data={data}
      isLoading={isLoading}
      isError={isError}
      filters={s.filters}
      onFilterChange={s.onFilterChange}
      onReset={s.onReset}
      actionOptions={Object.values(BatteryAuditActionCode)}
      targetLabel="Battery ID"
      sort={s.sort}
      pageNumber={s.pageNumber}
      pageSize={s.pageSize}
      onPageChange={s.setPageNumber}
      onPageSizeChange={s.setPageSize}
    />
  );
}

function AlertAuditTab() {
  const s = useAuditTabState();
  const { data, isLoading, isError } = useAlertAuditLogs(
    {
      action: s.filters.action,
      alertId: s.filters.target,
      from: toUtcStart(s.filters.dateFrom),
      to: toUtcEnd(s.filters.dateTo),
      sortBy: s.sortBy || undefined,
      sortDir: s.sortBy ? s.sortDir : undefined,
      pageNumber: s.pageNumber,
      pageSize: s.pageSize,
    },
    rangeValid(s.filters),
  );

  return (
    <AuditPanel
      data={data}
      isLoading={isLoading}
      isError={isError}
      filters={s.filters}
      onFilterChange={s.onFilterChange}
      onReset={s.onReset}
      actionOptions={Object.values(AlertAuditActionCode)}
      targetLabel="Alert ID"
      sort={s.sort}
      pageNumber={s.pageNumber}
      pageSize={s.pageSize}
      onPageChange={s.setPageNumber}
      onPageSizeChange={s.setPageSize}
    />
  );
}

export default function BatteryAuditLogsPage() {
  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin · System
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Audit Logs — Battery & Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forensic lookup of battery and alert operations (fallback
            resilience).
          </p>
        </div>
        <RefreshButton
          queryKeys={[KEY.admin.batteryAuditLogs, KEY.admin.alertAuditLogs]}
        />
      </div>

      <Tabs defaultValue="battery">
        <TabsList>
          <TabsTrigger value="battery">Battery</TabsTrigger>
          <TabsTrigger value="alert">Alert</TabsTrigger>
        </TabsList>
        <TabsContent value="battery" className="mt-4">
          <BatteryAuditTab />
        </TabsContent>
        <TabsContent value="alert" className="mt-4">
          <AlertAuditTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
