import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReportManualIncident } from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  manualIncidentSchema,
  type ManualIncidentFormValues,
} from "@/shared/schemas/alerts/environmental.schema";
import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";
import { AlertSeverityEnum } from "@/shared/enums/alerts/alert.enum";
import type { SiteOption } from "@/shared/types/site/site.types";
import { incidentTypeLabel } from "@/shared/constants/incidentLabels";

const TYPE_OPTIONS = [
  EnvironmentalIncidentTypeEnum.Smoke,
  EnvironmentalIncidentTypeEnum.FireDetected,
  EnvironmentalIncidentTypeEnum.GasLeak,
  EnvironmentalIncidentTypeEnum.Flood,
  EnvironmentalIncidentTypeEnum.OverheatHazard,
  EnvironmentalIncidentTypeEnum.Other,
];

const SEVERITY_OPTIONS: { value: AlertSeverityEnum; label: string }[] = [
  { value: AlertSeverityEnum.Info, label: "Thông tin" },
  { value: AlertSeverityEnum.Warning, label: "Cảnh báo" },
  { value: AlertSeverityEnum.Critical, label: "Nguy hiểm" },
];

export default function ManualIncidentDialog({
  open,
  onOpenChange,
  sites,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: SiteOption[];
}) {
  const { mutateAsync } = useReportManualIncident();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ManualIncidentFormValues>({
    resolver: zodResolver(manualIncidentSchema),
  });

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: ManualIncidentFormValues) => {
    try {
      await mutateAsync(values);
      close();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report sự cố môi trường</DialogTitle>
          <DialogDescription>
            Dùng khi phát hiện sự cố tại site mà không có cảm biến tự động
            (cháy, khói, ngập...).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="siteId">Site *</Label>
            <Controller
              control={control}
              name="siteId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="siteId">
                    <SelectValue placeholder="Chọn site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
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
            <Label htmlFor="incidentType">Loại sự cố *</Label>
            <Controller
              control={control}
              name="incidentType"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger id="incidentType">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {incidentTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.incidentType && (
              <p className="text-sm text-destructive">
                {errors.incidentType.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="severity">Mức độ *</Label>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={String(s.value)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.severity && (
              <p className="text-sm text-destructive">
                {errors.severity.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Mô tả tình huống quan sát được..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
