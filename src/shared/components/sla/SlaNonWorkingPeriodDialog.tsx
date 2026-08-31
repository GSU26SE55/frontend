import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  slaNonWorkingPeriodSchema,
  todayIsoDate,
  SLA_REASON_MAX_LENGTH,
  type SlaNonWorkingPeriodForm,
} from "@/shared/schemas/sla/sla-calendar.schema";
import {
  useCreateSlaNonWorkingPeriod,
  useUpdateSlaNonWorkingPeriod,
} from "@/shared/hooks/sla/useSlaCalendar";
import type { SlaNonWorkingPeriodDto } from "@/shared/types/sla/sla-calendar.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing an existing period; omit to create a new one. */
  period?: SlaNonWorkingPeriodDto | null;
}

const EMPTY: SlaNonWorkingPeriodForm = {
  startDate: "",
  endDate: "",
  reason: "",
};

export default function SlaNonWorkingPeriodDialog({
  open,
  onOpenChange,
  period,
}: Props) {
  const isEdit = !!period;
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SlaNonWorkingPeriodForm>({
    resolver: zodResolver(slaNonWorkingPeriodSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      period
        ? {
            startDate: period.startDate.slice(0, 10),
            endDate: period.endDate.slice(0, 10),
            reason: period.reason,
          }
        : EMPTY,
    );
  }, [open, period, reset]);

  const { mutateAsync: createPeriod } = useCreateSlaNonWorkingPeriod();
  const { mutateAsync: updatePeriod } = useUpdateSlaNonWorkingPeriod();

  const onSubmit = async (data: SlaNonWorkingPeriodForm) => {
    try {
      const payload = {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason.trim(),
      };
      if (period) await updatePeriod({ id: period.id, payload });
      else await createPeriod(payload);
      onOpenChange(false);
    } catch (error) {
      // An overlapping range comes back as a 409 with a plain message rather than field
      // errors, so it surfaces as a toast; validation failures map onto the fields.
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit non-working period" : "Add non-working period"}
          </DialogTitle>
          <DialogDescription>
            Days in this range are skipped when SLA deadlines are calculated.
            Saving also re-calculates the deadline of every ticket still
            running.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate">
                From <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    id="startDate"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    // The BE rejects a start date before today (ValidateStartDate), on both
                    // create and edit — so the calendar never offers one.
                    min={todayIsoDate()}
                  />
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">
                To <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    id="endDate"
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    min={todayIsoDate()}
                  />
                )}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              maxLength={SLA_REASON_MAX_LENGTH}
              placeholder="Tết holiday, site maintenance window..."
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
