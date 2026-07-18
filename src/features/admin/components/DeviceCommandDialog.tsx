import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  deviceCommandSchema,
  type DeviceCommandForm,
} from "@/features/admin/schemas/iot-device.schema";
import { useSendIotDeviceCommand } from "@/features/admin/hooks/useIotDeviceMutations";
import { IOT_COMMAND_TYPES } from "@/shared/enums/iot.enum";

const CUSTOM = "__custom__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
}

export default function DeviceCommandDialog({
  open,
  onOpenChange,
  deviceId,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceCommandForm>({
    resolver: zodResolver(deviceCommandSchema),
    defaultValues: { type: IOT_COMMAND_TYPES[0] },
  });

  const { mutateAsync: sendCommand } = useSendIotDeviceCommand(deviceId);

  useEffect(() => {
    if (open) reset({ type: IOT_COMMAND_TYPES[0], params: "", cmdId: "" });
  }, [open, reset]);

  const onSubmit = async (data: DeviceCommandForm) => {
    let parsedParams: Record<string, unknown> | undefined;
    if (data.params && data.params.trim()) {
      try {
        parsedParams = JSON.parse(data.params);
      } catch {
        setError("params", { type: "manual", message: "JSON không hợp lệ" });
        return;
      }
    }
    try {
      const res = await sendCommand({
        type: data.type,
        params: parsedParams,
        cmdId: data.cmdId || undefined,
      });
      toast.success(
        res.data ? `Đã gửi command tới ${res.data.topic}` : "Đã gửi command",
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
          <DialogTitle>Gửi command tới thiết bị</DialogTitle>
          <DialogDescription>
            Relay xuống MQTT topic của thiết bị; device ack qua kênh riêng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Loại command *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => {
                // type không thuộc danh sách gợi ý = chế độ custom (input tự nhập).
                const isKnown = (
                  IOT_COMMAND_TYPES as readonly string[]
                ).includes(field.value);
                const selectValue = isKnown ? field.value : CUSTOM;
                return (
                  <>
                    <Select
                      value={selectValue}
                      onValueChange={(v) =>
                        field.onChange(v === CUSTOM ? "" : (v ?? ""))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {IOT_COMMAND_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM}>Khác (tự nhập)…</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectValue === CUSTOM && (
                      <Input
                        placeholder="Nhập loại command"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </>
                );
              }}
            />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="params">Params (JSON)</Label>
            <Textarea
              id="params"
              {...register("params")}
              placeholder='{"key": "value"}'
              className="font-mono text-xs"
            />
            {errors.params && (
              <p className="text-sm text-destructive">
                {errors.params.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cmdId">Command ID (tuỳ chọn)</Label>
            <Input
              id="cmdId"
              {...register("cmdId")}
              placeholder="Bỏ trống → backend tự sinh"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Gửi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
