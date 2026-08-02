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

// 4 kênh — `global` là khoá tương ứng ở công tắc toàn cục (channels), dùng để
// disable ô khi kênh đó đã bị tắt ở phần trên (BE: channels luôn thắng dòng nhóm).
const CHANNEL_COLUMNS = [
  { key: "pushEnabled", label: "Push" },
  { key: "emailEnabled", label: "Email" },
  { key: "smsEnabled", label: "SMS" },
  { key: "inAppEnabled", label: "Trong ứng dụng" },
] as const;

type ChannelKey = (typeof CHANNEL_COLUMNS)[number]["key"];

const CATEGORY_LABEL: Record<NotificationCategoryEnum, string> = {
  [NotificationCategoryEnum.Ticket]: "Ticket",
  [NotificationCategoryEnum.Sla]: "SLA & chuyển cấp",
  [NotificationCategoryEnum.Battery]: "Pin & thiết bị IoT",
  [NotificationCategoryEnum.Environmental]: "Sự cố môi trường",
  [NotificationCategoryEnum.Chat]: "Trao đổi trên ticket",
  [NotificationCategoryEnum.Account]: "Tài khoản & hệ thống",
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

// Gom type theo nhóm để giải thích "tắt nhóm này thì mất thông báo nào".
// Dữ liệu lấy từ API, KHÔNG nhân bản bảng ánh xạ ở client.
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
    // Vá từng dòng: chỉ gửi nhóm đã đổi. Mỗi dòng vẫn gửi đủ 4 kênh vì BE ghi
    // field thiếu thành false chứ không giữ giá trị cũ.
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
      // Form này toàn switch, không có ô text để hiện lỗi field; BE lại trả field
      // dạng "Items.Category" / "UserId" — không khớp path RHF nào. Không toast
      // thêm thì EntityError bị nuốt hoàn toàn (handleErrorApi return sớm).
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
        <Loader2 className="size-4 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">
          Không tải được tuỳ chọn theo nhóm.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <p className="text-[13px] font-semibold">Thông báo theo nhóm</p>
        <p className="text-xs text-muted-foreground">
          Tắt riêng từng nhóm mà không mất các nhóm còn lại. Kênh đã tắt ở phần
          trên vẫn thắng mọi thiết lập tại đây.
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left font-medium px-4 py-2.5">Nhóm</th>
              {CHANNEL_COLUMNS.map((col) => {
                const globalOff = channels ? !channels[col.key] : false;
                return (
                  <th
                    key={col.key}
                    className="font-medium px-3 py-2.5 text-center whitespace-nowrap"
                  >
                    {col.label}
                    {globalOff && (
                      <span className="block text-[10px] font-normal text-muted-foreground">
                        đang tắt
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
              // isCustomized của lần fetch gần nhất; sau khi user gạt switch mà
              // chưa lưu thì giá trị form đã khác — vẫn hiện "Kế thừa" cho tới
              // khi lưu xong (đúng trạng thái server).
              const inherited = !cat.isCustomized;
              return (
                <tr key={cat.category}>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {CATEGORY_LABEL[cat.category] ?? cat.categoryName}
                      </span>
                      {inherited && (
                        <Badge variant="secondary" className="text-[10px]">
                          Kế thừa
                        </Badge>
                      )}
                    </div>
                    {types.length > 0 && (
                      <p
                        className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1"
                        title={types.join(", ")}
                      >
                        {types.length} loại thông báo
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
          {update.isPending ? "Đang lưu…" : "Lưu tuỳ chọn nhóm"}
        </Button>
      </div>
    </form>
  );
}
