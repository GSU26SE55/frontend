import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  useNotificationTemplates,
  useActivateTemplate,
  useDeleteTemplate,
} from "@/features/admin/hooks/notification/useNotificationTemplates";
import NotificationTemplateTable from "@/features/admin/components/notification/NotificationTemplateTable";
import TemplateCoveragePanel from "@/features/admin/components/notification/TemplateCoveragePanel";
import NotificationTemplatePreviewDialog from "@/features/admin/components/notification/NotificationTemplatePreviewDialog";
import NotificationTemplateFormDialog from "@/features/admin/components/notification/NotificationTemplateFormDialog";
import type { NotificationTemplateDto } from "@/features/admin/types/notification/notification-template.types";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";

const ALL = "__all__";

// 02/08/2026 — BE lọc theo giá trị SỐ của enum; option hiện nhãn tiếng Việt, value là số.
// Sắp theo bảng chữ cái tiếng Việt để dropdown 34 mục còn tra được bằng mắt.
const TYPE_OPTIONS = Object.values(NotificationTypeEnum)
  .map((value) => ({ value, label: notificationTypeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, "vi"));

const CHANNEL_OPTIONS = Object.values(NotificationChannelEnum).map((value) => ({
  value,
  label: notificationChannelLabel(value),
}));

// Chuỗi rỗng = không lọc. useUrlFilters xoá key rỗng khỏi URL và TỰ đưa pageNumber về 1 mỗi khi
// đổi filter — nhờ vậy không bao giờ rơi vào cảnh "đang ở trang 9, lọc còn 2 trang, bảng trống".
//
// type/channel để kiểu chuỗi ở tầng URL (query param vốn là chuỗi), chuyển sang số khi gọi API.
const DEFAULTS = {
  type: "",
  channel: "",
  pageNumber: 1,
  pageSize: 10,
};

const FILTER_DEFS = [
  { key: "type", label: "Loại", options: TYPE_OPTIONS },
  { key: "channel", label: "Kênh", options: CHANNEL_OPTIONS },
] as const;

export default function NotificationTemplatesPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [previewTarget, setPreviewTarget] =
    useState<NotificationTemplateDto | null>(null);
  // `null` = đóng; `{ target: null }` = mở ở chế độ tạo mới; `{ target: t }` = sửa mẫu t.
  // Gói trong object để phân biệt "đang đóng" với "đang mở để tạo mới" — hai trạng thái này mà
  // cùng biểu diễn bằng null thì dialog tạo mới không bao giờ mở được.
  const [formState, setFormState] = useState<{
    target: NotificationTemplateDto | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<NotificationTemplateDto | null>(null);

  const params = useMemo(
    () => ({
      // URL giữ chuỗi, API nhận số — Number("") = 0 nên phải kiểm tra rỗng trước.
      type: filters.type
        ? (Number(filters.type) as NotificationTypeEnum)
        : undefined,
      channel: filters.channel
        ? (Number(filters.channel) as NotificationChannelEnum)
        : undefined,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    }),
    [filters],
  );

  const { data, isLoading } = useNotificationTemplates(params);
  const activate = useActivateTemplate();
  const remove = useDeleteTemplate();

  const templates = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;

  return (
    <div className="p-6 space-y-5 max-w-350 mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            <FileText className="inline size-3 mr-1 -mt-0.5" />
            Thông báo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mẫu thông báo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Soạn, xem trước, gửi thử và quay lui phiên bản. Sửa nội dung sẽ tạo
            phiên bản mới; mỗi cặp (loại × kênh) chỉ có đúng một bản đang dùng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton queryKeys={[KEY.admin.notificationTemplates]} />
          <Button size="sm" onClick={() => setFormState({ target: null })}>
            <Plus className="size-3.5" /> Tạo mẫu
          </Button>
        </div>
      </div>

      <TemplateCoveragePanel />

      <Card className="rounded-xl overflow-hidden py-0 gap-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
          {FILTER_DEFS.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <Select
                value={filters[f.key] || ALL}
                // Select trả null khi bỏ chọn → quy về chuỗi rỗng (không lọc).
                onValueChange={(v) =>
                  setFilter(f.key, !v || v === ALL ? "" : v)
                }
                items={[
                  { value: ALL, label: "Tất cả" },
                  ...f.options.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  })),
                ]}
              >
                <SelectTrigger className="w-52 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>Tất cả</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <NotificationTemplateTable
          templates={templates}
          isLoading={isLoading}
          activatingId={activate.isPending ? activate.variables : null}
          deletingId={remove.isPending ? remove.variables : null}
          onPreview={setPreviewTarget}
          onActivate={(t) => activate.mutate(t.id)}
          onEdit={(t) => setFormState({ target: t })}
          onDelete={setDeleteTarget}
        />
      </Card>

      <DataPagination
        totalItems={totalItems}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      {/* key = id → đổi template thì remount, state preview/quota tự sạch. */}
      <NotificationTemplatePreviewDialog
        key={previewTarget?.id}
        template={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />

      {/* key theo mục tiêu → remount để defaultValues của form luôn khớp mẫu đang mở,
          khỏi cần effect reset (vốn gây một nhịp render mang dữ liệu của mẫu trước). */}
      {formState && (
        <NotificationTemplateFormDialog
          key={formState.target?.id ?? "create"}
          open
          onOpenChange={(open) => !open && setFormState(null)}
          editTarget={formState.target}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá phiên bản này?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Xoá <strong>v{deleteTarget.version}</strong> của mẫu{" "}
                  <strong>
                    {notificationTypeLabel(deleteTarget.type)} ·{" "}
                    {notificationChannelLabel(deleteTarget.channel)}
                  </strong>
                  . Bản đang dùng không bị ảnh hưởng.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)} />
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
