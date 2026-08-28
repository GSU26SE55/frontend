import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { handleErrorApi, EntityError } from "@/shared/lib/errors";
import {
  notificationMatrixSchema,
  type NotificationMatrixFormValues,
} from "@/shared/schemas/notification/notification-matrix.schema";
import {
  useNotificationMatrix,
  useNotificationCategories,
  useUpdateNotificationMatrix,
} from "@/shared/hooks/notifications/useNotificationMatrix";
import { NotificationCategoryEnum } from "@/shared/enums/notification/notification.enum";
import type {
  NotificationCategoryPreferenceDto,
  NotificationCategoryMapDto,
} from "@/shared/types/notification/notification-matrix.types";
import type { NotificationPreferenceDto } from "@/shared/types/notification/notification-preference.types";
import { MESSAGES } from "@/shared/constants/messages";

// 4 channels — `global` is the matching key on the global toggle (channels), used to
// disable the cell when that channel is already off above (BE: channels always win over category rows).
const CHANNEL_COLUMNS = [
  { key: "pushEnabled", label: "Push" },
  { key: "emailEnabled", label: "Email" },
  { key: "smsEnabled", label: "SMS" },
  { key: "inAppEnabled", label: "In-app" },
] as const;

type ChannelKey = (typeof CHANNEL_COLUMNS)[number]["key"];

const CATEGORY_LABEL: Record<NotificationCategoryEnum, string> = {
  [NotificationCategoryEnum.Ticket]: "Ticket",
  [NotificationCategoryEnum.Sla]: "SLA & escalation",
  [NotificationCategoryEnum.Battery]: "Battery & devices",
  [NotificationCategoryEnum.Environmental]: "Environmental incidents",
  [NotificationCategoryEnum.Chat]: "Ticket conversations",
  [NotificationCategoryEnum.Account]: "Account & system",
};

function toFormValues(
  categories: NotificationCategoryPreferenceDto[],
): NotificationMatrixFormValues {
  return {
    items: categories.map((c) => ({
      category: c.category,
      pushEnabled: c.pushEnabled,
      emailEnabled: c.emailEnabled,
      smsEnabled: c.smsEnabled,
      inAppEnabled: c.inAppEnabled,
    })),
  };
}

// Group types by category to explain "turning off this category loses which notifications".
// Data comes from the API — the mapping table is NOT duplicated on the client.
function groupTypesByCategory(
  map: NotificationCategoryMapDto[] | undefined,
): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  for (const entry of map ?? []) {
    (result[entry.categoryValue] ??= []).push(entry.type);
  }
  return result;
}

export default function NotificationCategoryMatrixSection() {
  const { data, isLoading, isError, refetch } = useNotificationMatrix();
  const { data: categoryMap } = useNotificationCategories();
  const update = useUpdateNotificationMatrix();

  const typesByCategory = useMemo(
    () => groupTypesByCategory(categoryMap),
    [categoryMap],
  );

  const { handleSubmit, setError, reset, control } =
    useForm<NotificationMatrixFormValues>({
      resolver: zodResolver(notificationMatrixSchema),
      defaultValues: { items: [] },
    });

  useEffect(() => {
    if (data?.categories) reset(toFormValues(data.categories));
  }, [data, reset]);

  const channels: NotificationPreferenceDto | undefined = data?.channels;

  const onSubmit = async (values: NotificationMatrixFormValues) => {
    const original = data?.categories ?? [];
    // Patch per row: only send categories that changed. Each row still sends all 4
    // channels because the BE writes a missing field as false instead of keeping the old value.
    const changed = values.items.filter((item) => {
      const before = original.find((c) => c.category === item.category);
      if (!before) return true;
      return CHANNEL_COLUMNS.some((col) => before[col.key] !== item[col.key]);
    });

    if (changed.length === 0) {
      toast.info(MESSAGES.notificationPrefs.matrixNoChange);
      return;
    }

    try {
      await update.mutateAsync({ items: changed });
      toast.success(MESSAGES.notificationPrefs.matrixSaved);
    } catch (error) {
      // This form is all switches, no text field to show a field error; the BE returns fields
      // like "Items.Category" / "UserId" that don't match any RHF path. Without this extra
      // toast, EntityError gets fully swallowed (handleErrorApi returns early).
      if (error instanceof EntityError) {
        toast.error(
          error.errors[0]?.detail ??
            MESSAGES.notificationPrefs.matrixSaveFailed,
        );
        return;
      }
      handleErrorApi({ error, setError });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">
          Failed to load category preferences.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <p className="text-2sm font-semibold">Notifications by category</p>
        <p className="text-xs text-muted-foreground">
          Turn off individual categories without losing the rest. A channel
          turned off above still overrides any setting here.
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left font-medium px-4 py-2.5">Category</th>
              {CHANNEL_COLUMNS.map((col) => {
                const globalOff = channels ? !channels[col.key] : false;
                return (
                  <th
                    key={col.key}
                    className="font-medium px-3 py-2.5 text-center whitespace-nowrap"
                  >
                    {col.label}
                    {globalOff && (
                      <span className="block text-3xs font-normal text-muted-foreground">
                        off
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.categories.map((cat, index) => {
              const types = typesByCategory[cat.category] ?? [];
              // isCustomized from the latest fetch; after the user flips a switch without
              // saving, the form value already differs — still shows "Inherited" until
              // saved (reflects actual server state).
              const inherited = !cat.isCustomized;
              return (
                <tr key={cat.category}>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {CATEGORY_LABEL[cat.category] ?? cat.categoryName}
                      </span>
                      {inherited && (
                        <Badge variant="secondary" className="text-3xs">
                          Inherited
                        </Badge>
                      )}
                    </div>
                    {types.length > 0 && (
                      <p
                        className="text-2xs text-muted-foreground mt-0.5 line-clamp-1"
                        title={types.join(", ")}
                      >
                        {types.length} notification types
                      </p>
                    )}
                  </td>

                  {CHANNEL_COLUMNS.map((col) => {
                    const globalOff = channels ? !channels[col.key] : false;
                    return (
                      <td key={col.key} className="px-3 py-3 text-center">
                        <Controller
                          name={
                            `items.${index}.${col.key}` as `items.${number}.${ChannelKey}`
                          }
                          control={control}
                          render={({ field }) => (
                            <Switch
                              id={`matrix-${cat.category}-${col.key}`}
                              aria-label={`${CATEGORY_LABEL[cat.category]} — ${col.label}`}
                              checked={!!field.value}
                              disabled={globalOff}
                              onCheckedChange={(v) =>
                                field.onChange(v === true)
                              }
                            />
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={update.isPending || data.categories.length === 0}
        >
          {update.isPending ? "Saving…" : "Save category preferences"}
        </Button>
      </div>
    </form>
  );
}
