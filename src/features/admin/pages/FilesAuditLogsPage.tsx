import { useState } from "react";
import { Card } from "@/components/ui/card";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useFileAuditLogs } from "@/features/admin/hooks/file/useFileAuditLogs";
import BatteryAuditLogTable from "@/features/admin/components/battery/BatteryAuditLogTable";
import AuditLogFilterBar, {
  type AuditLogFilterValues,
} from "@/features/admin/components/account/AuditLogFilterBar";
import { FileAuditActionCode } from "@/features/admin/enums/file-audit.enum";

// YYYY-MM-DD → UTC range (BE filter từ/đến).
const toUtcStart = (d?: string) => (d ? `${d}T00:00:00Z` : undefined);
const toUtcEnd = (d?: string) => (d ? `${d}T23:59:59Z` : undefined);

// Range hợp lệ → mới gọi API (chặn from > to trước khi gọi).
const rangeValid = (f: AuditLogFilterValues) =>
  !(f.dateFrom && f.dateTo && f.dateFrom > f.dateTo);

// GH-133 C5 — audit truy cập file GDPR (FileStorageService, Admin only).
export default function FilesAuditLogsPage() {
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

  const { data, isLoading, isError } = useFileAuditLogs(
    {
      action: filters.action,
      fileId: filters.target,
      from: toUtcStart(filters.dateFrom),
      to: toUtcEnd(filters.dateTo),
      pageNumber,
      pageSize,
    },
    rangeValid(filters),
  );

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin · Hệ thống
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Audit Logs — Truy cập File
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tra cứu forensic truy cập file (GDPR / điều tra rò rỉ dữ liệu).
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.admin.fileAuditLogs]} />
      </div>

      <div className="space-y-4">
        <Card className="gap-0 py-0 overflow-hidden">
          <AuditLogFilterBar
            values={filters}
            onChange={onFilterChange}
            onReset={onReset}
            actionOptions={Object.values(FileAuditActionCode)}
            targetLabel="File ID"
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
          onPageChange={setPageNumber}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
