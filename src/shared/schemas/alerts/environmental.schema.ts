import { z } from "zod";
import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";
import { AlertSeverityEnum } from "@/shared/enums/alerts/alert.enum";

// POST /api/environmental-incidents/manual — report thủ công bằng JWT.
// BE validate: SiteId không Guid.Empty; IncidentType/Severity phải hợp lệ; Notes ≤ 1000.
export const manualIncidentSchema = z.object({
  siteId: z.string().uuid("Site không hợp lệ"),
  incidentType: z.nativeEnum(EnvironmentalIncidentTypeEnum),
  severity: z.nativeEnum(AlertSeverityEnum),
  // Tên field phải là `notes` — khớp BE `Notes`, không phải `note`.
  notes: z.string().trim().max(1000, "Tối đa 1000 ký tự").optional(),
});
export type ManualIncidentFormValues = z.infer<typeof manualIncidentSchema>;

export const resolveIncidentSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, "Tối thiểu 5 ký tự")
    .max(2000, "Tối đa 2000 ký tự"),
});
export type ResolveIncidentFormValues = z.infer<typeof resolveIncidentSchema>;

export const falseAlarmSchema = z.object({
  falseAlarmReason: z
    .string()
    .trim()
    .min(5, "Tối thiểu 5 ký tự")
    .max(2000, "Tối đa 2000 ký tự"),
});
export type FalseAlarmFormValues = z.infer<typeof falseAlarmSchema>;
