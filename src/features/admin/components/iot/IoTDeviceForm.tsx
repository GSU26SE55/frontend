import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import ApiKeyScopesField from "@/features/admin/components/iot/ApiKeyScopesField";
import {
  createIotDeviceSchema,
  updateIotDeviceSchema,
  type CreateIotDeviceForm,
  type UpdateIotDeviceForm,
} from "@/features/admin/schemas/iot/iot-device.schema";
import {
  useCreateIotDevice,
  useUpdateIotDevice,
} from "@/features/admin/hooks/iot/useIotDeviceMutations";
import { useIotFirmware } from "@/features/admin/hooks/iot/useIotFirmware";
import { useSiteList } from "@/features/admin/hooks/site/useSites";
import {
  IotApiKeyScopeEnum,
  IotDeviceStatusEnum,
} from "@/shared/enums/iot/iot.enum";
import type {
  IotDeviceDto,
  IotDeviceCreatedDto,
} from "@/shared/types/iot/iot.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

const STATUS_OPTIONS: { value: IotDeviceStatusEnum; label: string }[] = [
  { value: IotDeviceStatusEnum.Pending, label: "Chờ provision" },
  { value: IotDeviceStatusEnum.Active, label: "Hoạt động" },
  { value: IotDeviceStatusEnum.Offline, label: "Offline" },
  { value: IotDeviceStatusEnum.Disabled, label: "Vô hiệu hóa" },
  { value: IotDeviceStatusEnum.Decommissioned, label: "Ngừng sử dụng" },
];

interface Props {
  device?: IotDeviceDto; // undefined = create
  onCreated: (dto: IotDeviceCreatedDto) => void;
  onUpdated: () => void;
  onCancel: () => void;
}

export default function IoTDeviceForm({
  device,
  onCreated,
  onUpdated,
  onCancel,
}: Props) {
  const isEdit = !!device;
  const { data: sitesData } = useSiteList();
  const { data: firmwareData } = useIotFirmware({ publishedOnly: true });

  const createForm = useForm<CreateIotDeviceForm>({
    resolver: zodResolver(createIotDeviceSchema),
    defaultValues: {
      apiKeyScopes: IotApiKeyScopeEnum.EdgeDeviceDefault,
      heartbeatIntervalSeconds: 60,
    },
  });
  const editForm = useForm<UpdateIotDeviceForm>({
    resolver: zodResolver(updateIotDeviceSchema),
    defaultValues: device
      ? {
          displayName: device.displayName,
          siteId: device.siteId,
          hardwareRevision: device.hardwareRevision ?? undefined,
          status: device.status,
          apiKeyScopes: device.apiKeyScopes,
          heartbeatIntervalSeconds: device.heartbeatIntervalSeconds,
          targetFirmwareReleaseId: device.targetFirmwareReleaseId ?? undefined,
          notes: device.notes ?? undefined,
        }
      : undefined,
  });

  const { mutateAsync: createDevice } = useCreateIotDevice();
  const { mutateAsync: updateDevice } = useUpdateIotDevice(device?.id ?? "");

  // ── Edit mode ──
  if (isEdit) {
    const {
      register,
      handleSubmit,
      control,
      setError,
      formState: { errors, isSubmitting },
    } = editForm;

    const onSubmit = async (data: UpdateIotDeviceForm) => {
      try {
        await updateDevice({
          displayName: data.displayName,
          siteId: data.siteId,
          hardwareRevision: data.hardwareRevision || undefined,
          status: data.status,
          apiKeyScopes: data.apiKeyScopes,
          heartbeatIntervalSeconds: data.heartbeatIntervalSeconds,
          targetFirmwareReleaseId: data.targetFirmwareReleaseId || undefined,
          notes: data.notes || undefined,
        });
        toast.success(ADMIN_MESSAGES.iot.deviceUpdated);
        onUpdated();
      } catch (error) {
        handleErrorApi({ error, setError });
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
        <div className="space-y-1">
          <Label>Device Code</Label>
          <Input
            value={device.deviceCode}
            readOnly
            className="cursor-not-allowed opacity-60 font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Không thể đổi device code sau khi tạo.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="displayName">Tên hiển thị *</Label>
          <Input id="displayName" {...register("displayName")} />
          {errors.displayName && (
            <p className="text-sm text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Site *</Label>
            <Controller
              control={control}
              name="siteId"
              render={({ field }) => (
                <Select
                  value={field.value ?? null}
                  items={
                    sitesData?.items.map((s) => ({
                      value: s.id,
                      label: s.name,
                    })) ?? []
                  }
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn site" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {sitesData?.items.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.siteId && (
              <p className="text-sm text-destructive">
                {errors.siteId.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Trạng thái *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : null}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="hardwareRevision">Hardware revision</Label>
            <Input id="hardwareRevision" {...register("hardwareRevision")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="heartbeatIntervalSeconds">Heartbeat (giây)</Label>
            <Input
              id="heartbeatIntervalSeconds"
              type="number"
              {...register("heartbeatIntervalSeconds", { valueAsNumber: true })}
            />
            {errors.heartbeatIntervalSeconds && (
              <p className="text-sm text-destructive">
                {errors.heartbeatIntervalSeconds.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Target firmware OTA</Label>
          <Controller
            control={control}
            name="targetFirmwareReleaseId"
            render={({ field }) => (
              <Select
                value={field.value ?? null}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Không đặt target" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {firmwareData?.items.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.version} ({f.hardwareRevision})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Chỉ liệt kê release đã publish &amp; chưa archive.
          </p>
        </div>

        <div className="space-y-1">
          <Label>API key scopes</Label>
          <Controller
            control={control}
            name="apiKeyScopes"
            render={({ field }) => (
              <ApiKeyScopesField
                value={field.value ?? IotApiKeyScopeEnum.EdgeDeviceDefault}
                onChange={field.onChange}
              />
            )}
          />
          {errors.apiKeyScopes && (
            <p className="text-sm text-destructive">
              {errors.apiKeyScopes.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    );
  }

  // ── Create mode ──
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = createForm;

  const onSubmit = async (data: CreateIotDeviceForm) => {
    try {
      const res = await createDevice({
        deviceCode: data.deviceCode,
        displayName: data.displayName,
        siteId: data.siteId,
        hardwareRevision: data.hardwareRevision || undefined,
        apiKeyScopes: data.apiKeyScopes,
        heartbeatIntervalSeconds: data.heartbeatIntervalSeconds,
        notes: data.notes || undefined,
      });
      if (res.data) {
        toast.success(ADMIN_MESSAGES.iot.deviceCreated);
        onCreated(res.data);
      }
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="deviceCode">Device Code *</Label>
          <Input
            id="deviceCode"
            {...register("deviceCode")}
            placeholder="ESP32-001"
            className="font-mono"
          />
          {errors.deviceCode && (
            <p className="text-sm text-destructive">
              {errors.deviceCode.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="displayName">Tên hiển thị *</Label>
          <Input id="displayName" {...register("displayName")} />
          {errors.displayName && (
            <p className="text-sm text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Site *</Label>
          <Controller
            control={control}
            name="siteId"
            render={({ field }) => (
              <Select
                value={field.value ?? null}
                items={
                  sitesData?.items.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })) ?? []
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn site" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {sitesData?.items.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.siteId && (
            <p className="text-sm text-destructive">{errors.siteId.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="hardwareRevision">Hardware revision</Label>
          <Input
            id="hardwareRevision"
            {...register("hardwareRevision")}
            placeholder="v1.0-S3-MAX485"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="heartbeatIntervalSeconds">Heartbeat (giây)</Label>
        <Input
          id="heartbeatIntervalSeconds"
          type="number"
          placeholder="60"
          {...register("heartbeatIntervalSeconds", { valueAsNumber: true })}
        />
        {errors.heartbeatIntervalSeconds && (
          <p className="text-sm text-destructive">
            {errors.heartbeatIntervalSeconds.message}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        API key scopes mặc định "Edge Device" (đủ cho thiết bị gửi sensor +
        heartbeat) — chỉnh lại sau trong màn Sửa thiết bị nếu cần scope khác.
      </p>

      <div className="space-y-1">
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Tạo thiết bị
        </Button>
      </div>
    </form>
  );
}
