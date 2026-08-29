import { z } from "zod";
import { requiredSelect } from "@/shared/schemas/common.schema";
import { EnvironmentalIncidentTypeEnum } from "@/shared/enums/alerts/environmental.enum";
import { AlertSeverityEnum } from "@/shared/enums/alerts/alert.enum";

// POST /api/environmental-incidents/manual — manual report authenticated by JWT.
// BE validates: SiteId not Guid.Empty; IncidentType/Severity must be valid; Notes ≤ 1000.
export const manualIncidentSchema = z.object({
  siteId: requiredSelect(z.string().uuid("Invalid site"), "Select a site"),
  incidentType: requiredSelect(
    z.nativeEnum(EnvironmentalIncidentTypeEnum),
    "Select an incident type",
  ),
  severity: requiredSelect(
    z.nativeEnum(AlertSeverityEnum),
    "Select a severity",
  ),
  // The field must be named `notes` — matches BE `Notes`, not `note`.
  notes: z
    .string()
    .trim()
    .max(1000, "Must be at most 1000 characters")
    .optional(),
});
export type ManualIncidentFormValues = z.infer<typeof manualIncidentSchema>;

export const resolveIncidentSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, "Must be at least 5 characters")
    .max(2000, "Must be at most 2000 characters"),
});
export type ResolveIncidentFormValues = z.infer<typeof resolveIncidentSchema>;

export const falseAlarmSchema = z.object({
  falseAlarmReason: z
    .string()
    .trim()
    .min(5, "Must be at least 5 characters")
    .max(2000, "Must be at most 2000 characters"),
});
export type FalseAlarmFormValues = z.infer<typeof falseAlarmSchema>;
