import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

const ALL = "__all__";

// 08/02/2026 — BE filters by the enum's NUMERIC value; the option shows an English label, the value is a number.
// Sorted alphabetically so the 34-item dropdown can still be scanned visually.
const TYPE_OPTIONS = Object.values(NotificationTypeEnum)
  .map((value) => ({ value, label: notificationTypeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, "en"));

const CHANNEL_OPTIONS = Object.values(NotificationChannelEnum).map((value) => ({
  value,
  label: notificationChannelLabel(value),
}));

// Empty string = no filter. useUrlFilters strips empty keys from the URL and AUTOMATICALLY resets
// pageNumber to 1 whenever a filter changes — this avoids ever landing on "page 9, filter now has 2 pages, table empty".
//
// type/channel stay as strings at the URL layer (query params are inherently strings), converted to numbers when calling the API.
const DEFAULTS = {
  type: "",
  channel: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

const FILTER_DEFS = [
  { key: "type", label: "Type", options: TYPE_OPTIONS },
  { key: "channel", label: "Channel", options: CHANNEL_OPTIONS },
] as const;

export default function NotificationTemplatesPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [previewTarget, setPreviewTarget] =
    useState<NotificationTemplateDto | null>(null);
  // `null` = closed; `{ target: null }` = open in create mode; `{ target: t }` = edit template t.
  // Wrapped in an object to distinguish "closed" from "open to create" — if both states were
  // represented by null, the create dialog could never open.
  const [formState, setFormState] = useState<{
    target: NotificationTemplateDto | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<NotificationTemplateDto | null>(null);

  const params = useMemo(
    () => ({
      // URL keeps a string, the API expects a number — Number("") = 0, so check for empty first.
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
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Notifications
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : totalItems} templates &mdash; manage
            notification content.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setFormState({ target: null })}>
            <Plus className="size-3.5" /> Create template
          </Button>
          <RefreshButton queryKeys={[KEY.admin.notificationTemplates]} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {FILTER_DEFS.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <Select
              value={filters[f.key] || ALL}
              // Select returns null when deselected → normalize to an empty string (no filter).
              onValueChange={(v) => setFilter(f.key, !v || v === ALL ? "" : v)}
              items={[
                { value: ALL, label: "All" },
                ...f.options.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                })),
              ]}
            >
              <SelectTrigger size="sm" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value={ALL}>All</SelectItem>
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

      <Card className="gap-0 py-0 overflow-hidden">
        <NotificationTemplateTable
          templates={templates}
          isLoading={isLoading}
          pageNumber={filters.pageNumber}
          pageSize={filters.pageSize}
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

      {/* key = id → remounts when the template changes, so preview/quota state resets automatically. */}
      <NotificationTemplatePreviewDialog
        key={previewTarget?.id}
        template={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />

      {/* key on the target → remounts so the form's defaultValues always match the open template,
          avoiding a reset effect (which would otherwise cause one render carrying the previous template's data). */}
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
            <AlertDialogTitle>Delete this version?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Delete <strong>v{deleteTarget.version}</strong> of template{" "}
                  <strong>
                    {notificationTypeLabel(deleteTarget.type)} ·{" "}
                    {notificationChannelLabel(deleteTarget.channel)}
                  </strong>
                  . The version currently in use is not affected.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
