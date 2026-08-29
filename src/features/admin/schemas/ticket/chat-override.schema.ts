import { z } from "zod";

// GH-133 C4 — Admin edits/deletes chat on a Closed ticket. BE requires overrideReason.
// Caps mirror ChatOverrideEditCommand / ChatOverrideDeleteCommand on the BE.
const OVERRIDE_REASON_MAX = 1000;
const OVERRIDE_BODY_MAX = 10000;

const overrideReasonField = z
  .string()
  .trim()
  .min(1, "Override reason is required")
  .max(
    OVERRIDE_REASON_MAX,
    `Override reason must be at most ${OVERRIDE_REASON_MAX} characters`,
  );

export const chatOverrideEditSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(OVERRIDE_BODY_MAX, `Must be at most ${OVERRIDE_BODY_MAX} characters`),
  overrideReason: overrideReasonField,
});
export type ChatOverrideEditPayload = z.infer<typeof chatOverrideEditSchema>;

export const chatOverrideDeleteSchema = z.object({
  overrideReason: overrideReasonField,
});
export type ChatOverrideDeletePayload = z.infer<
  typeof chatOverrideDeleteSchema
>;
