import { z } from "zod";

// GH-133 C4 — Admin edits/deletes chat on a Closed ticket. BE requires overrideReason.
export const chatOverrideEditSchema = z.object({
  body: z.string().trim().min(1, "This field is required"),
  overrideReason: z.string().trim().min(1, "Override reason is required"),
});
export type ChatOverrideEditPayload = z.infer<typeof chatOverrideEditSchema>;

export const chatOverrideDeleteSchema = z.object({
  overrideReason: z.string().trim().min(1, "Override reason is required"),
});
export type ChatOverrideDeletePayload = z.infer<
  typeof chatOverrideDeleteSchema
>;
