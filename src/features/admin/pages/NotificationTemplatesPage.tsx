import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import {
  useNotificationTemplates,
  useActivateTemplate,
} from "@/features/admin/hooks/notification/useNotificationTemplates";
import NotificationTemplateTable from "@/features/admin/components/notification/NotificationTemplateTable";
import NotificationTemplatePreviewDialog from "@/features/admin/components/notification/NotificationTemplatePreviewDialog";
import type { NotificationTemplateDto } from "@/features/admin/types/notification/notification-template.types";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

const ALL = "__all__";

// BE lọc theo TÊN enum (chuỗi), không phải số → build option từ khoá của enum.
const TYPE_OPTIONS = Object.keys(NotificationTypeEnum);
const CHANNEL_OPTIONS = Object.keys(NotificationChannelEnum);
const LOCALE_OPTIONS = ["vi-VN", "en-US"];

export default function NotificationTemplatesPage() {
  const [type, setType] = useState(ALL);
  const [channel, setChannel] = useState(ALL);
  const [locale, setLocale] = useState(ALL);
  const [previewTarget, setPreviewTarget] =
    useState<NotificationTemplateDto | null>(null);

  const params = useMemo(
    () => ({
      type: type === ALL ? undefined : type,
      channel: channel === ALL ? undefined : channel,
      locale: locale === ALL ? undefined : locale,
    }),
    [type, channel, locale],
  );

  const { data: templates = [], isLoading } = useNotificationTemplates(params);
  const activate = useActivateTemplate();

  const filters = [
    { label: "Loại", value: type, onChange: setType, options: TYPE_OPTIONS },
    {
      label: "Kênh",
      value: channel,
      onChange: setChannel,
      options: CHANNEL_OPTIONS,
    },
    {
      label: "Ngôn ngữ",
      value: locale,
      onChange: setLocale,
      options: LOCALE_OPTIONS,
    },
  ];

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
            Xem trước, gửi thử và quay lui phiên bản. Mỗi bộ ba (loại × kênh ×
            ngôn ngữ) chỉ có đúng một bản đang dùng.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.admin.notificationTemplates]} />
      </div>

      <Card className="rounded-xl overflow-hidden py-0 gap-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
          {filters.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{f.label}</span>
              <Select
                value={f.value}
                // Select trả null khi bỏ chọn → quy về ALL (không lọc).
                onValueChange={(v) => f.onChange(v ?? ALL)}
                items={[
                  { value: ALL, label: "Tất cả" },
                  ...f.options.map((o) => ({ value: o, label: o })),
                ]}
              >
                <SelectTrigger className="w-45 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value={ALL}>Tất cả</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
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
          onPreview={setPreviewTarget}
          onActivate={(t) => activate.mutate(t.id)}
        />
      </Card>

      {/* key = id → đổi template thì remount, state preview/quota tự sạch. */}
      <NotificationTemplatePreviewDialog
        key={previewTarget?.id}
        template={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}
