import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

// Default matches BE GetNotificationPreferenceQueryHandler (not yet configured)
/**
 * The one time zone the system runs on. Not a user choice: quiet hours are resolved
 * against it on the BE (NotificationDispatcher falls back to this same value), so
 * letting a user pick a different one only makes their quiet hours fire at unexpected
 * local times. The field still travels in the PUT payload — the BE column is required.
 */
const SYSTEM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const DEFAULT_PREF: NotificationPreferenceFormValues = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  inAppEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  timeZone: SYSTEM_TIME_ZONE,
};

const CHANNELS = [
  { name: "pushEnabled", label: "Push", desc: "Push notification to devices" },
  { name: "emailEnabled", label: "Email", desc: "Send via email" },
  { name: "smsEnabled", label: "SMS", desc: "Send via SMS message" },
  { name: "inAppEnabled", label: "In-app", desc: "Show inside the app" },
] as const;

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
    // Not editable in the UI: the system runs on a single time zone. Kept in the form
    // (and in the PUT payload) because quiet hours are meaningless without it — the BE
    // resolves them against this value. Echo back what the BE stored rather than forcing
    // SYSTEM_TIME_ZONE, so a value set elsewhere is not silently overwritten on save.
    timeZone: dto.timeZone || SYSTEM_TIME_ZONE,
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

  // Quiet hours toggle derived from form value (avoids parallel state + set-state-in-effect)
  const quietHoursStart = useWatch({ control, name: "quietHoursStart" });
  const quietHoursEnabled = quietHoursStart !== null;

  // Load+edit: fill the form when data arrives (differs from registration form, which uses static defaultValues)
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
    // Safety: quiet hours off → always send null/null
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
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4.5 w-40" />
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
            {CHANNELS.map((ch) => (
              <div
                key={ch.name}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4.5 w-24" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">
          Failed to load notification settings.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Notification channels */}
      <div className="space-y-3">
        <p className="text-2sm font-semibold">Notification channels</p>
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

      {/* Quiet hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2sm font-semibold">Quiet hours</p>
            <p className="text-xs text-muted-foreground">
              Pause notifications during this time range (supports overnight).
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
              <Label htmlFor="pref-quiet-start">Start</Label>
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
              <Label htmlFor="pref-quiet-end">End</Label>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
