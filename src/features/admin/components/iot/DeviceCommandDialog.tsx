import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangleIcon, CheckIcon, InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import IoTDeviceStatusBadge from "@/shared/components/iot/IoTDeviceStatusBadge";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  deviceCommandSchema,
  type DeviceCommandForm,
} from "@/features/admin/schemas/iot/iot-device.schema";
import { useSendIotDeviceCommand } from "@/features/admin/hooks/iot/useIotDeviceMutations";
import {
  IOT_COMMAND_META,
  IOT_COMMAND_TYPES,
  IotDeviceStatusEnum,
  POLLING_PRESETS,
  POLLING_SECONDS_MAX,
  POLLING_SECONDS_MIN,
  type IotCommandType,
} from "@/shared/enums/iot/iot.enum";

const DEFAULTS: DeviceCommandForm = {
  mode: "guided",
  type: IOT_COMMAND_TYPES[0],
  pollingSeconds: "5",
  params: "",
  cmdId: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  /**
   * Chỉ dùng để cảnh báo trước khi gửi. Thiết bị nối broker ở chế độ phiên sạch
   * (`PubSubClient.cpp:220` bật cờ Clean Session vô điều kiện) nên broker KHÔNG giữ lệnh hộ
   * thiết bị đang offline — lệnh gửi lúc đó mất luôn, mà HTTP vẫn trả 202.
   */
  deviceStatus?: IotDeviceStatusEnum;
}

export default function DeviceCommandDialog({
  open,
  onOpenChange,
  deviceId,
  deviceStatus,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceCommandForm>({
    resolver: zodResolver(deviceCommandSchema),
    defaultValues: DEFAULTS,
  });

  const { mutateAsync: sendCommand } = useSendIotDeviceCommand(deviceId);

  const mode = useWatch({ control, name: "mode" });
  const type = useWatch({ control, name: "type" });
  const pollingSeconds = useWatch({ control, name: "pollingSeconds" });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const meta = IOT_COMMAND_META[type as IotCommandType];

  const onSubmit = async (data: DeviceCommandForm) => {
    let params: Record<string, unknown> | undefined;

    if (data.mode === "guided") {
      // Chỉ set_interval mang tham số. Hai lệnh còn lại firmware bỏ qua params, gửi kèm chỉ
      // làm gói to thêm.
      if (data.type === "set_interval") {
        params = { pollingSeconds: Number((data.pollingSeconds ?? "").trim()) };
      }
    } else if (data.params?.trim()) {
      // Schema đã kiểm là object JSON hợp lệ nên chỗ này không cần try/catch nữa.
      params = JSON.parse(data.params) as Record<string, unknown>;
    }

    try {
      const res = await sendCommand({
        type: data.type.trim(),
        params,
        cmdId: data.cmdId?.trim() || undefined,
      });
      // 202 = "đã đưa vào broker", KHÔNG phải "thiết bị đã thực thi". Thiết bị trả kết quả
      // qua `solar/{deviceCode}/cmd/ack`. Nói mập mờ ở đây là để Admin tưởng lệnh đã chạy.
      toast.success(
        res.data
          ? `Đã đẩy lệnh xuống ${res.data.topic} — thiết bị sẽ báo kết quả riêng`
          : "Đã đẩy lệnh xuống broker",
      );
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gửi lệnh tới thiết bị</DialogTitle>
          <DialogDescription>
            Lệnh được đẩy xuống thiết bị qua MQTT. Thiết bị báo kết quả về sau,
            không phải ngay lúc bấm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {deviceStatus !== undefined &&
            deviceStatus !== IotDeviceStatusEnum.Active && (
            <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
              <span>
                Thiết bị đang ở trạng thái{" "}
                <IoTDeviceStatusBadge status={deviceStatus} />. Lệnh gửi lúc này
                sẽ <b>mất</b> chứ không nằm chờ — broker không giữ lệnh hộ thiết
                bị đang ngắt kết nối. Đợi thiết bị hoạt động trở lại rồi gửi
                lại.
              </span>
            </p>
          )}

          {mode === "guided" ? (
            <>
              <div className="space-y-2">
                <Label>Chọn lệnh</Label>
                <div role="radiogroup" aria-label="Chọn lệnh" className="grid gap-2">
                  {IOT_COMMAND_TYPES.map((t) => {
                    const item = IOT_COMMAND_META[t];
                    const selected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setValue("type", t, { shouldValidate: true })
                        }
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {selected && <CheckIcon className="size-3" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {type === "set_interval" && (
                <div className="space-y-2">
                  <Label htmlFor="pollingSeconds">Nhịp lấy mẫu</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {POLLING_PRESETS.map((preset) => (
                      <Button
                        key={preset.seconds}
                        type="button"
                        size="sm"
                        variant={
                          (pollingSeconds ?? "").trim() ===
                          String(preset.seconds)
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setValue("pollingSeconds", String(preset.seconds), {
                            shouldValidate: true,
                          })
                        }
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pollingSeconds"
                      type="number"
                      inputMode="numeric"
                      min={POLLING_SECONDS_MIN}
                      max={POLLING_SECONDS_MAX}
                      step={1}
                      className="w-24"
                      {...register("pollingSeconds")}
                    />
                    <span className="text-sm text-muted-foreground">
                      giây — nhận từ {POLLING_SECONDS_MIN} đến{" "}
                      {POLLING_SECONDS_MAX}
                    </span>
                  </div>
                  {errors.pollingSeconds && (
                    <p className="text-sm text-destructive">
                      {errors.pollingSeconds.message}
                    </p>
                  )}
                </div>
              )}

              {meta && (
                <p className="flex gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                  <InfoIcon className="mt-px size-3.5 shrink-0" />
                  <span>{meta.effect}</span>
                </p>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label htmlFor="rawType">Tên lệnh</Label>
                <Input
                  id="rawType"
                  placeholder="vd: set_interval"
                  {...register("type")}
                />
                {errors.type && (
                  <p className="text-sm text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="params">Tham số (JSON)</Label>
                <Textarea
                  id="params"
                  {...register("params")}
                  placeholder='{"pollingSeconds": 5}'
                  className="font-mono text-xs"
                />
                {errors.params && (
                  <p className="text-sm text-destructive">
                    {errors.params.message}
                  </p>
                )}
              </div>

              {/* Chế độ thô giữ lại để gửi được lệnh mới trước khi giao diện kịp cập nhật.
                  Nhưng phải nói rõ đánh đổi: backend vẫn trả 202 dù firmware không hiểu —
                  202 chỉ nghĩa là "đã đưa vào broker". */}
              <p className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
                <span>
                  Firmware hiện chỉ hiểu{" "}
                  <code>{IOT_COMMAND_TYPES.join(" · ")}</code>. Tên khác vẫn gửi
                  được và vẫn trả 202, nhưng thiết bị sẽ báo{" "}
                  <code>unknown</code> và không làm gì.
                </span>
              </p>
            </>
          )}

          {/* `key` đổi theo `open` để mỗi lần mở lại hộp thoại, phần nâng cao luôn ở trạng thái
              đóng — `<details>` không kiểm soát nên gắn key rẻ hơn giữ thêm một state. */}
          <details
            key={open ? "advanced-shown" : "advanced-hidden"}
            onToggle={(e) => {
              // Đóng phần nâng cao thì quay hẳn về chế độ hướng dẫn. Nếu không, form có thể
              // ở chế độ thô mà toàn bộ ô nhập của nó bị giấu — người dùng thấy một cái nút
              // Gửi không rõ sẽ gửi cái gì.
              if (!e.currentTarget.open) reset(DEFAULTS);
            }}
            className="rounded-lg border border-dashed border-input"
          >
            <summary className="cursor-pointer px-3 py-2 text-sm text-muted-foreground select-none">
              Tuỳ chọn nâng cao
            </summary>
            <div className="space-y-3 border-t border-dashed border-input p-3">
              <div className="space-y-1">
                <Label htmlFor="cmdId">Mã lệnh (tuỳ chọn)</Label>
                <Input
                  id="cmdId"
                  {...register("cmdId")}
                  placeholder="Bỏ trống → hệ thống tự sinh"
                />
                <p className="text-xs text-muted-foreground">
                  Dùng để đối chiếu với phản hồi của thiết bị trong log.
                </p>
              </div>

              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Label htmlFor="rawMode">Tự nhập lệnh và JSON</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Dành cho lệnh chưa có trong danh sách.
                      </p>
                    </div>
                    <Switch
                      id="rawMode"
                      checked={field.value === "raw"}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? "raw" : "guided");
                        // Đổi chế độ thì trả ô nhập của chế độ kia về mặc định, tránh gửi
                        // nhầm giá trị còn sót lại của lần gõ trước.
                        setValue("type", checked ? "" : IOT_COMMAND_TYPES[0]);
                        setValue("params", "");
                        setValue("pollingSeconds", DEFAULTS.pollingSeconds);
                      }}
                    />
                  </div>
                )}
              />
            </div>
          </details>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Gửi lệnh
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
