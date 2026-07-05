import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  uploadFirmwareSchema,
  type UploadFirmwareForm,
} from "@/features/admin/schemas/iot-firmware.schema";
import { useCreateFirmwareRelease } from "@/features/admin/hooks/useIotFirmwareMutations";
import { IotFirmwareChannelEnum } from "@/shared/enums/iot.enum";

export default function IoTFirmwareFormPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UploadFirmwareForm>({
    resolver: zodResolver(uploadFirmwareSchema),
    defaultValues: {
      channel: IotFirmwareChannelEnum.Stable,
      isRequired: false,
      publishImmediately: false,
    },
  });

  const { mutateAsync: createRelease } = useCreateFirmwareRelease();

  const onSubmit = async (data: UploadFirmwareForm) => {
    try {
      // 2-step: upload .bin → tạo release. Hook tự chạy tuần tự.
      await createRelease({
        file: data.file,
        version: data.version,
        hardwareRevision: data.hardwareRevision,
        isRequired: data.isRequired,
        channel: data.channel,
        releaseNotes: data.releaseNotes,
        deviceModel: data.deviceModel,
        publishImmediately: data.publishImmediately,
      });
      toast.success("Tạo firmware release thành công");
      navigate("/admin/iot-firmware");
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/iot-firmware")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; IoT Firmware
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tạo firmware release
          </h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <Label htmlFor="file">File firmware (.bin) *</Label>
            <Input
              id="file"
              type="file"
              accept=".bin"
              onChange={(e) =>
                setValue("file", e.target.files?.[0] as File, {
                  shouldValidate: true,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 50MB. Backend tự tính SHA-256.
            </p>
            {errors.file && (
              <p className="text-sm text-destructive">{errors.file.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="version">Version (SemVer) *</Label>
              <Input
                id="version"
                {...register("version")}
                placeholder="1.2.3"
                className="font-mono"
              />
              {errors.version && (
                <p className="text-sm text-destructive">
                  {errors.version.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="hardwareRevision">Hardware revision *</Label>
              <Input
                id="hardwareRevision"
                {...register("hardwareRevision")}
                placeholder="v1.0-S3-MAX485"
              />
              {errors.hardwareRevision && (
                <p className="text-sm text-destructive">
                  {errors.hardwareRevision.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Channel</Label>
              <Controller
                control={control}
                name="channel"
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : null}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={String(IotFirmwareChannelEnum.Stable)}>
                        Stable
                      </SelectItem>
                      <SelectItem value={String(IotFirmwareChannelEnum.Beta)}>
                        Beta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deviceModel">Device model</Label>
              <Input
                id="deviceModel"
                {...register("deviceModel")}
                placeholder="ESP32-S3-WROOM-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="releaseNotes">Release notes (markdown)</Label>
            <Textarea id="releaseNotes" {...register("releaseNotes")} />
          </div>

          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="isRequired"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                  <span>Force update (bắt buộc)</span>
                </label>
              )}
            />
            <Controller
              control={control}
              name="publishImmediately"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                  <span>Publish ngay sau khi tạo</span>
                </label>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/iot-firmware")}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Tạo release
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
