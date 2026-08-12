import { z } from "zod";

// #AUTH-47 — Admin merge: secondary account id (Guid) + reason (1–1000).
// Matches BE validation in MergeAccountCommand.
export const mergeAccountSchema = z.object({
  secondaryAccountId: z.string().uuid("Select a valid account to merge"),
  reason: z
    .string()
    .min(1, "Reason is required (for audit purposes)")
    .max(1000, "Reason must be at most 1000 characters"),
});
export type MergeAccountFormValues = z.infer<typeof mergeAccountSchema>;
