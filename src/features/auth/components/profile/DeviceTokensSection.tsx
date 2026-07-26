import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import { DevicePlatformEnum } from "@/shared/enums/notification/notification.enum";
import { toneClass } from "@/shared/theme/statusColors";
import {
  registerDeviceTokenSchema,
  type RegisterDeviceTokenFormValues,
} from "@/shared/schemas/notification/device-token.schema";
import {
  useDeviceTokens,
  useRegisterDeviceToken,
  useUnregisterDeviceToken,
} from "@/shared/hooks/notifications/useDeviceTokens";
import { MESSAGES } from "@/shared/constants/messages";

// Map int → nhãn (repo không có util chung — khai báo inline theo pattern hiện hữu)
const PLATFORM_LABEL: Record<DevicePlatformEnum, string> = {
  [DevicePlatformEnum.Ios]: "iOS",
  [DevicePlatformEnum.Android]: "Android",
  [DevicePlatformEnum.Web]: "Web",
};

const PLATFORM_OPTIONS = [
  { value: DevicePlatformEnum.Web, label: "Web" },
  { value: DevicePlatformEnum.Ios, label: "iOS" },
  { value: DevicePlatformEnum.Android, label: "Android" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}

export default function DeviceTokensSection() {
  const { data: devices, isLoading, isError } = useDeviceTokens();
  const register = useRegisterDeviceToken();
  const unregister = useUnregisterDeviceToken();
  const [revokeToken, setRevokeToken] = useState("");

  const {
    register: registerField,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<RegisterDeviceTokenFormValues>({
    resolver: zodResolver(registerDeviceTokenSchema),
    defaultValues: {
      platform: DevicePlatformEnum.Web,
      deviceInfo:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
  });

  const onRegister = async (data: RegisterDeviceTokenFormValues) => {
    try {
      await register.mutateAsync({
        token: data.token,
        platform: data.platform,
        deviceInfo: data.deviceInfo || undefined,
      });
      toast.success(MESSAGES.device.registered);
      reset({
        platform: DevicePlatformEnum.Web,
        deviceInfo:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        token: "",
      });
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const onRevoke = () => {
    if (!revokeToken.trim()) return;
    unregister.mutate(
      { token: revokeToken.trim() },
      {
        onSuccess: () => {
          toast.success(MESSAGES.device.unregistered);
          setRevokeToken("");
        },
        onError: (error) => handleErrorApi({ error }),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Danh sách thiết bị */}
      <div>
        <p className="text-[13px] font-semibold mb-3">Thiết bị đã đăng ký</p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500">
            Không tải được danh sách thiết bị.
          </p>
        ) : !devices || devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có thiết bị nào đăng ký nhận thông báo đẩy.
          </p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
            {devices.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-start gap-3">
                <div className="mt-0.5 size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Smartphone size={13} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">
                      {PLATFORM_LABEL[d.platform] ?? "Khác"}
                    </p>
                    {d.isActive ? (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${toneClass("ok")}`}
                      >
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                        Đã hủy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.deviceInfo || "Không có mô tả thiết bị"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    Dùng gần nhất: {formatDate(d.lastUsedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Đăng ký thiết bị mới */}
      <form onSubmit={handleSubmit(onRegister)} className="space-y-3">
        <p className="text-[13px] font-semibold">Đăng ký thiết bị</p>
        <div className="space-y-1.5">
          <Label htmlFor="dt-token">
            Push token <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="dt-token"
              placeholder="Expo/FCM push token"
              className="flex-1"
              {...registerField("token")}
            />
            <Button
              type="submit"
              disabled={register.isPending}
              className="shrink-0"
            >
              {register.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Đăng ký
            </Button>
          </div>
          {errors.token && (
            <p className="text-xs text-red-500">{errors.token.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Controller
            name="platform"
            control={control}
            render={({ field }) => (
              <Select
                value={String(field.value)}
                items={PLATFORM_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn platform" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {PLATFORM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.platform && (
            <p className="text-xs text-red-500">{errors.platform.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dt-info">Mô tả thiết bị</Label>
          <Input
            id="dt-info"
            placeholder="VD: Pixel 8 — Android 15"
            {...registerField("deviceInfo")}
          />
          {errors.deviceInfo && (
            <p className="text-xs text-red-500">{errors.deviceInfo.message}</p>
          )}
        </div>
      </form>

      {/* Hủy đăng ký theo token (GET không trả raw token nên không thể hủy từ list) */}
      <div className="space-y-1.5">
        <Label htmlFor="dt-revoke">Hủy đăng ký theo token</Label>
        <div className="flex gap-2">
          <Input
            id="dt-revoke"
            placeholder="Dán push token cần hủy"
            value={revokeToken}
            onChange={(e) => setRevokeToken(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onRevoke}
            disabled={unregister.isPending || !revokeToken.trim()}
          >
            {unregister.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
