import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DataPagination from "@/shared/components/common/DataPagination";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useBatteryAuditLogs } from "@/features/admin/hooks/useBatteryAuditLogs";
import { useAlertAuditLogs } from "@/features/admin/hooks/useAlertAuditLogs";
import BatteryAuditLogTable from "@/features/admin/components/BatteryAuditLogTable";
import AuditLogFilterBar, {
  type AuditLogFilterValues,
} from "@/features/admin/components/AuditLogFilterBar";
import {
  BatteryAuditActionCode,
  AlertAuditActionCode,
} from "@/features/admin/enums/battery-audit.enum";
import type { BatteryAuditLogDto } from "@/features/admin/types/battery-audit.types";
import type { PaginationResponse } from "@/shared/types/api.types";

// YYYY-MM-DD → UTC range (BE filter từ/đến).
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
  const [pageSize, setPageSize] = useState(25);

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

  return {
    filters,
    onFilterChange,
    onReset,
    pageNumber,
    pageSize,
    setPageNumber,
    setPageSize,
  };
}

// Range hợp lệ → mới gọi API (chặn 422 from > to trước khi gọi).
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
      pageNumber={s.pageNumber}
      pageSize={s.pageSize}
      onPageChange={s.setPageNumber}
      onPageSizeChange={s.setPageSize}
    />
  );
}

export default function BatteryAuditLogsPage() {
  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin · Hệ thống
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Audit Logs — Pin & Cảnh báo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tra cứu forensic thao tác trên Pin và Cảnh báo (fallback
            resilience).
          </p>
        </div>
        <RefreshButton
          queryKeys={[KEY.admin.batteryAuditLogs, KEY.admin.alertAuditLogs]}
        />
      </div>

      <Tabs defaultValue="battery">
        <TabsList>
          <TabsTrigger value="battery">Pin (Battery)</TabsTrigger>
          <TabsTrigger value="alert">Cảnh báo (Alert)</TabsTrigger>
        </TabsList>
        <TabsContent value="battery" className="mt-4">
          <BatteryAuditTab />
        </TabsContent>
        <TabsContent value="alert" className="mt-4">
          <AlertAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
