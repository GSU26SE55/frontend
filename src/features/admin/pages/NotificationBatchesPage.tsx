import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
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

const ALL = "__all__";

const SOURCE_OPTIONS = Object.values(NotificationBatchSourceEnum).map(
  (value) => ({ value, label: notificationBatchSourceLabel(value) }),
);

const DEFAULTS = {
  source: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function NotificationBatchesPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      // URL giữ chuỗi, API nhận số — Number("") = 0 nên phải kiểm rỗng trước.
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
    <div className="p-6 space-y-5 max-w-300 mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            <History className="inline size-3 mr-1 -mt-0.5" />
            Thông báo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Lịch sử gửi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Mỗi dòng là <b>một lần gửi</b>, dù tới bao nhiêu người. Bấm vào để
            xem đã giao được bao nhiêu và bao nhiêu người đã đọc.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.admin.notificationBatches]} />
      </div>

      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Select
            value={filters.source || ALL}
            items={[
              { value: ALL, label: "Tất cả nguồn" },
              ...SOURCE_OPTIONS.map((o) => ({
                value: String(o.value),
                label: o.label,
              })),
            ]}
            onValueChange={(v) => setFilter("source", !v || v === ALL ? "" : v)}
          >
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={ALL}>Tất cả nguồn</SelectItem>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Đang tải…
          </p>
        ) : batches.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có lần gửi nào.
            </p>
            {/* Nói rõ giới hạn thay vì để người dùng tưởng mất dữ liệu. */}
            <p className="mt-1 text-xs text-muted-foreground">
              Màn hình này chỉ hiển thị các lần gửi từ khi tính năng được bật —
              thông báo cũ hơn không mang thông tin để gom lại thành lần gửi.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead className="w-40">Nguồn</TableHead>
                <TableHead className="w-28 text-right">Người nhận</TableHead>
                <TableHead className="w-24 text-right">Số dòng</TableHead>
                <TableHead className="w-40">Thời điểm</TableHead>
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
                      <Badge variant="secondary" className="text-[10px]">
                        {notificationTypeLabel(b.type)}
                      </Badge>
                      {b.channels.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-[10px]"
                        >
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
                    {new Date(b.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {data && data.totalItems > 0 && (
          <div className="border-t border-border p-3">
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
          </div>
        )}
      </Card>

      {detailId && (
        <NotificationBatchDetailDialog
          key={detailId}
          batchId={detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
    </div>
  );
}
