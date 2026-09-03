import { useState } from "react";
import {
  Loader2,
  Settings,
  ShieldAlert,
  Check,
  Radio,
  Smartphone,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAdminPushTransport,
  useAdminUpdatePushTransport,
} from "@/features/admin/hooks/notification/useCreateNotification";
import { PushTransportEnum } from "@/shared/types/notification/notification.types";

const TRANSPORT_ICONS: Record<number, LucideIcon> = {
  [PushTransportEnum.SignalR]: Radio,
  [PushTransportEnum.Expo]: Smartphone,
  [PushTransportEnum.Both]: Layers,
};

export default function PushTransportSettingsForm() {
  const { data: config, isLoading: isGetLoading } = useAdminPushTransport();
  const updateMutation = useAdminUpdatePushTransport();

  // User-picked value (null cho tới khi user tự chọn) — mặc định hiển thị theo
  // config.transport hiện tại của server, không sync qua effect.
  const [pickedTransport, setPickedTransport] = useState<number | null>(null);
  const selectedTransport = pickedTransport ?? config?.transport ?? null;

  const activeOption = config?.options.find(
    (opt) => opt.value === selectedTransport,
  );
  const isUnchanged = config?.transport === selectedTransport;

  const handleSave = () => {
    if (selectedTransport == null) return;
    updateMutation.mutate({
      transport: selectedTransport as PushTransportEnum,
    });
  };

  if (isGetLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
          <Settings className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            System Push Notification Strategy
          </h3>
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-40" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-border/80 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 shrink-0 rounded-full" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Settings className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          System Push Notification Strategy
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2.5">
          <Label className="text-xs font-semibold">
            Active Transport Channel
          </Label>

          {/* Radio cards thay cho dropdown: chỉ 3 lựa chọn loại trừ nhau, và mỗi
              lựa chọn cần mô tả ngay cạnh tên — bày hết ra đọc nhanh hơn là bắt
              user mở select rồi mới thấy description ở khối bên dưới. */}
          <div
            role="radiogroup"
            aria-label="Active transport channel"
            className="grid gap-2.5 sm:grid-cols-3"
          >
            {config?.options.map((opt) => {
              const Icon = TRANSPORT_ICONS[opt.value] ?? Radio;
              const isSelected = opt.value === selectedTransport;
              const isCurrent = opt.value === config.transport;

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setPickedTransport(opt.value)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors outline-none",
                    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/80 bg-card hover:bg-muted/50 hover:border-border",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {opt.name}
                    </span>
                    {isSelected && (
                      <Check className="size-3.5 ml-auto shrink-0 text-primary" />
                    )}
                  </div>

                  <p className="text-2xs leading-relaxed text-muted-foreground line-clamp-3">
                    {opt.description}
                  </p>

                  {isCurrent && (
                    <span className="inline-flex w-fit items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active now
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeOption?.requiresDeviceToken && (
          <div className="flex gap-2.5 p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <strong>Important Notice:</strong> Expo Push API transport
              requires native devices to register valid mobile tokens
              (`device-tokens` endpoint). System notifications will fail to
              deliver to users who have push services disabled on their phones
              or do not have valid tokens.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
        {!isUnchanged && activeOption && (
          <p className="text-xs text-muted-foreground mr-auto">
            Switching to{" "}
            <span className="font-semibold text-foreground">
              {activeOption.name}
            </span>
            {config?.transportName ? ` from ${config.transportName}` : ""}.
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={
            updateMutation.isPending || selectedTransport == null || isUnchanged
          }
          size="sm"
          className="h-9 px-4 text-xs font-semibold"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="animate-spin size-3.5 mr-2" />
              Saving Settings...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
