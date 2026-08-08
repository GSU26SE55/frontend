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
  { value: IotDeviceStatusEnum.Pending, label: "Pending provisioning" },
  { value: IotDeviceStatusEnum.Active, label: "Active" },
  { value: IotDeviceStatusEnum.Offline, label: "Offline" },
  { value: IotDeviceStatusEnum.Disabled, label: "Disabled" },
  { value: IotDeviceStatusEnum.Decommissioned, label: "Decommissioned" },
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
            Device code can't be changed after creation.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="displayName">Display name *</Label>
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
                    <SelectValue placeholder="Select site" />
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
            <Label>Status *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : null}
                  onValueChange={(v) => field.onChange(Number(v))}
                  items={STATUS_OPTIONS.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
            <Label htmlFor="heartbeatIntervalSeconds">
              Heartbeat (seconds)
            </Label>
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
                items={
                  firmwareData?.items.map((f) => ({
                    value: f.id,
                    label: `${f.version} (${f.hardwareRevision})`,
                  })) ?? []
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No target set" />
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
            Only published, non-archived releases are listed.
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
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Save changes
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
          <Label htmlFor="displayName">Display name *</Label>
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
                  <SelectValue placeholder="Select site" />
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
        <Label htmlFor="heartbeatIntervalSeconds">Heartbeat (seconds)</Label>
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
        API key scopes default to "Edge Device" (enough for a device sending
        sensor data + heartbeat) — change it later on the Edit device screen if
        you need different scopes.
      </p>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Create device
        </Button>
      </div>
    </form>
  );
}
