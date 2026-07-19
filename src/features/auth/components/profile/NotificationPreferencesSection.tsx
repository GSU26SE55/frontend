import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  notificationPreferenceSchema,
  type NotificationPreferenceFormValues,
} from "@/shared/schemas/notification/notification-preference.schema";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/shared/hooks/notifications/useNotificationPreferences";
import type { NotificationPreferenceDto } from "@/shared/types/notification/notification-preference.types";
import { MESSAGES } from "@/shared/constants/messages";

// Default khớp BE GetNotificationPreferenceQueryHandler (chưa cấu hình)
const DEFAULT_PREF: NotificationPreferenceFormValues = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  timeZone: "Asia/Ho_Chi_Minh",
};

const CHANNELS = [
  { name: "pushEnabled", label: "Push", desc: "Thông báo đẩy tới thiết bị" },
  { name: "emailEnabled", label: "Email", desc: "Gửi qua email" },
  { name: "smsEnabled", label: "SMS", desc: "Gửi qua tin nhắn SMS" },
  { name: "inAppEnabled", label: "Trong ứng dụng", desc: "Hiển thị trong app" },
] as const;

const TIMEZONE_OPTIONS = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "UTC",
];

function toFormValues(
  dto: NotificationPreferenceDto,
): NotificationPreferenceFormValues {
  return {
    pushEnabled: dto.pushEnabled,
    emailEnabled: dto.emailEnabled,
    smsEnabled: dto.smsEnabled,
    inAppEnabled: dto.inAppEnabled,
    quietHoursStart: dto.quietHoursStart ?? null,
    quietHoursEnd: dto.quietHoursEnd ?? null,
    timeZone: dto.timeZone,
  };
}

export default function NotificationPreferencesSection() {
  const { data, isLoading, isError, refetch } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const {
    handleSubmit,
    setError,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<NotificationPreferenceFormValues>({
    resolver: zodResolver(notificationPreferenceSchema),
    defaultValues: DEFAULT_PREF,
  });

  // Bật/tắt quiet hours suy ra từ giá trị form (tránh state song song + set-state-in-effect)
  const quietHoursStart = useWatch({ control, name: "quietHoursStart" });
  const quietHoursEnabled = quietHoursStart !== null;

  // Load+edit: fill form khi data về (pattern khác form đăng-ký dùng defaultValues tĩnh)
  useEffect(() => {
    if (data) reset(toFormValues(data));
  }, [data, reset]);

  const onToggleQuietHours = (enabled: boolean) => {
    if (enabled) {
      setValue("quietHoursStart", "22:00");
      setValue("quietHoursEnd", "07:00");
    } else {
      setValue("quietHoursStart", null);
      setValue("quietHoursEnd", null);
    }
  };

  const onSubmit = async (values: NotificationPreferenceFormValues) => {
    // An toàn: quiet hours tắt → luôn gửi null/null
    const payload: NotificationPreferenceFormValues = quietHoursEnabled
      ? values
      : { ...values, quietHoursStart: null, quietHoursEnd: null };
    try {
      await update.mutateAsync(payload);
      toast.success(MESSAGES.notificationPrefs.saved);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">
          Không tải được cài đặt thông báo.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Kênh nhận thông báo */}
      <div className="space-y-3">
        <p className="text-[13px] font-semibold">Kênh nhận thông báo</p>
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
          {CHANNELS.map((ch) => (
            <div
              key={ch.name}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{ch.label}</p>
                <p className="text-xs text-muted-foreground">{ch.desc}</p>
              </div>
              <Controller
                name={ch.name}
                control={control}
                render={({ field }) => (
                  <Switch
                    id={`pref-${ch.name}`}
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Khung giờ yên tĩnh */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">Khung giờ yên tĩnh</p>
            <p className="text-xs text-muted-foreground">
              Tạm dừng thông báo trong khung giờ này (hỗ trợ qua đêm).
            </p>
          </div>
          <Switch
            id="pref-quiet-toggle"
            checked={quietHoursEnabled}
            onCheckedChange={(v) => onToggleQuietHours(v === true)}
          />
        </div>

        {quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pref-quiet-start">Bắt đầu</Label>
              <Controller
                name="quietHoursStart"
                control={control}
                render={({ field }) => (
                  <Input
                    id="pref-quiet-start"
                    type="time"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {errors.quietHoursStart && (
                <p className="text-xs text-red-500">
                  {errors.quietHoursStart.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pref-quiet-end">Kết thúc</Label>
              <Controller
                name="quietHoursEnd"
                control={control}
                render={({ field }) => (
                  <Input
                    id="pref-quiet-end"
                    type="time"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {errors.quietHoursEnd && (
                <p className="text-xs text-red-500">
                  {errors.quietHoursEnd.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Múi giờ */}
      <div className="space-y-1.5">
        <Label>Múi giờ</Label>
        <Controller
          name="timeZone"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn múi giờ" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.timeZone && (
          <p className="text-xs text-red-500">{errors.timeZone.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Lưu cài đặt
        </Button>
      </div>
    </form>
  );
}
