import { z } from "zod";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  TEMPLATE_TITLE_MAX,
  TEMPLATE_BODY_MAX,
} from "@/features/admin/types/notification/notification-template.types";

// Template composer. Length limits match the DB columns and the BE's ValidateAsync — checked on the
// FE so errors show while typing, but the BE still re-checks since any client could skip this layer.
//
// Does NOT validate Handlebars syntax here: proper validation would require compiling with the same
// engine the BE uses. Guessing with regex would both miss cases and false-positive; the BE returns 400
// with a specific message, so we leave it as is.
export const notificationTemplateFormSchema = z.object({
  // Zod v4: the second parameter takes `{ message }`, no more `errorMap` like in v3.
  type: z.nativeEnum(NotificationTypeEnum, {
    message: "Select a notification type",
  }),
  channel: z.nativeEnum(NotificationChannelEnum, {
    message: "Select a channel",
  }),
  titleTemplate: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      TEMPLATE_TITLE_MAX,
      `Title must be at most ${TEMPLATE_TITLE_MAX} characters`,
    ),
  bodyTemplate: z
    .string()
    .trim()
    .min(1, "Body is required")
    .max(
      TEMPLATE_BODY_MAX,
      `Body must be at most ${TEMPLATE_BODY_MAX} characters`,
    ),
});

export type NotificationTemplateFormValues = z.infer<
  typeof notificationTemplateFormSchema
>;

// sampleData is entered as raw JSON in a textarea. Empty ⇒ render with an empty model
// (a placeholder with no value renders as an empty string — that's how we detect a template
// referencing the wrong variable name).
export const templateSampleDataSchema = z.object({
  sampleDataJson: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        try {
          const parsed: unknown = JSON.parse(v);
          return (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          );
        } catch {
          return false;
        }
      },
      {
        message: 'Must be a valid JSON object, e.g. { "ticketCode": "TK-001" }',
      },
    ),
});

export type TemplateSampleDataFormValues = z.infer<
  typeof templateSampleDataSchema
>;

// Safe parse for the service — call after the schema has validated.
export function parseSampleData(
  json?: string,
): Record<string, unknown> | undefined {
  if (!json?.trim()) return undefined;
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
