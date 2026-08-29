import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { KEY } from "@/shared/utils/queryKeys";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationBatchSourceLabel,
} from "@/shared/constants/notificationLabels";
import { useNotificationBatches } from "@/features/admin/hooks/notification/useNotificationGroups";
import NotificationBatchDetailDialog from "@/features/admin/components/notification/NotificationBatchDetailDialog";
import {
  NotificationBatchSourceEnum,
  type NotificationBatchDto,
} from "@/features/admin/types/notification/notification-group.types";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";
import { formatDateTime } from "@/shared/utils/datetime";

const ALL = "__all__";

const SOURCE_OPTIONS = Object.values(NotificationBatchSourceEnum).map(
  (value) => ({ value, label: notificationBatchSourceLabel(value) }),
);

const DEFAULTS = {
  source: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export default function NotificationBatchesPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      // URL keeps a string, the API expects a number — Number("") = 0, so check for empty first.
      source: filters.source
        ? (Number(filters.source) as NotificationBatchSourceEnum)
        : undefined,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    }),
    [filters.source, filters.pageNumber, filters.pageSize],
  );

  const { data, isLoading } = useNotificationBatches(params);
  const batches: NotificationBatchDto[] = data?.items ?? [];

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Notifications
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Send history
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} sends &mdash; view
            notification send history.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.admin.notificationBatches]} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.source || ALL}
          items={[
            { value: ALL, label: "All sources" },
            ...SOURCE_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.label,
            })),
          ]}
          onValueChange={(v) => setFilter("source", !v || v === ALL ? "" : v)}
        >
          <SelectTrigger size="sm" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={ALL}>All sources</SelectItem>
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : batches.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No sends yet.</p>
            {/* State the limitation clearly instead of letting users think data was lost. */}
            <p className="mt-1 text-xs text-muted-foreground">
              This screen only shows sends made since this feature was enabled —
              older notifications don't carry the info needed to group them into
              a send.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead className="w-40">Source</TableHead>
                <TableHead className="w-28 text-right">Recipients</TableHead>
                <TableHead className="w-24 text-right">Rows</TableHead>
                <TableHead className="w-40">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => setDetailId(b.id)}
                >
                  <TableCell>
                    <p className="line-clamp-1 font-medium">{b.title}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-3xs">
                        {notificationTypeLabel(b.type)}
                      </Badge>
                      {b.channels.map((c) => (
                        <Badge key={c} variant="outline" className="text-3xs">
                          {notificationChannelLabel(c)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {notificationBatchSourceLabel(b.source)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.recipientCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.notificationCount}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(b.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.totalItems > 0 && (
        <DataPagination
          pageNumber={data.pageNumber}
          pageSize={data.pageSize}
          totalItems={data.totalItems}
          totalPages={data.totalPages}
          hasNextPage={data.hasNextPage}
          hasPreviousPage={data.hasPreviousPage}
          onPageChange={(p) => setFilter("pageNumber", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
        />
      )}

      {detailId && (
        <NotificationBatchDetailDialog
          key={detailId}
          batchId={detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
    </PageContainer>
  );
}
