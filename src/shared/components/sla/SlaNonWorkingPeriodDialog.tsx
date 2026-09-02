import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  slaNonWorkingPeriodSchema,
  tomorrowIsoDate,
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

type FieldErrors = Partial<Record<keyof SlaNonWorkingPeriodForm, string>>;

export default function SlaNonWorkingPeriodDialog({
  open,
  onOpenChange,
  period,
}: Props) {
  const isEdit = !!period;
  // Plain state instead of react-hook-form + a custom date picker: the three fields are
  // driven by <input type="date">, whose value IS the "yyyy-MM-dd" string the API wants, so
  // nothing can hold a date on screen that the form state does not have. The picker this
  // replaced kept its own text state and swallowed onChange when a typed date fell below
  // `min`, which left the dialog showing a filled date while the form still validated as empty.
  //
  // The parent keys this component on open+period, so mounting is the reset — no effect needed.
  const [values, setValues] = useState<SlaNonWorkingPeriodForm>(() =>
    period
      ? {
          startDate: period.startDate.slice(0, 10),
          endDate: period.endDate.slice(0, 10),
          reason: period.reason,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: createPeriod } = useCreateSlaNonWorkingPeriod();
  const { mutateAsync: updatePeriod } = useUpdateSlaNonWorkingPeriod();

  const setField = (field: keyof SlaNonWorkingPeriodForm, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Same feel as the old mode: "onChange" — an error clears as soon as the field is edited.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = slaNonWorkingPeriodSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof SlaNonWorkingPeriodForm;
        if (field && !next[field]) next[field] = issue.message;
      }
      setErrors(next);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = parsed.data;
      if (period) await updatePeriod({ id: period.id, payload });
      else await createPeriod(payload);
      onOpenChange(false);
    } catch (error) {
      // An overlapping range comes back as a 409 with a plain message rather than field
      // errors, so it surfaces as a toast; validation failures map onto the fields.
      handleErrorApi({
        error,
        setError: (field, err) =>
          setErrors((prev) => ({ ...prev, [field as string]: err?.message })),
      });
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate">
                From <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                // UI only offers a future date (today excluded) even though the BE's
                // ValidateStartDate would accept today too.
                min={tomorrowIsoDate()}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">
                To <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={values.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                min={values.startDate || tomorrowIsoDate()}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
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
              value={values.reason}
              onChange={(e) => setField("reason", e.target.value)}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
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
