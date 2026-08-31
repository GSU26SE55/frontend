import { z } from "zod";

/** SlaNonWorkingPeriodWriteCommand.ValidateAsync caps the reason at 500 characters. */
export const SLA_REASON_MAX_LENGTH = 500;

/** Today in the business timezone, as the yyyy-MM-dd string the date inputs use. */
export const todayIsoDate = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const slaNonWorkingPeriodSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required")
      .max(
        SLA_REASON_MAX_LENGTH,
        `Reason must be at most ${SLA_REASON_MAX_LENGTH} characters`,
      ),
  })
  // Mirrors ValidateAsync: the BE rejects a reversed range with a 400 on the EndDate field.
  .refine((d) => d.startDate <= d.endDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  })
  // Mirrors ValidateStartDate, which compares against "today" in Asia/Ho_Chi_Minh. Catching it
  // here keeps the message on the field instead of arriving as a toast.
  .refine((d) => d.startDate >= todayIsoDate(), {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  });

export type SlaNonWorkingPeriodForm = z.infer<typeof slaNonWorkingPeriodSchema>;
