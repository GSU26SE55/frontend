import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Must be at most 100 characters"),
  description: z.string().max(500, "Must be at most 500 characters").optional(),
});

export const editRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Must be at most 100 characters"),
  description: z.string().max(500, "Must be at most 500 characters").optional(),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
export type EditRoleFormValues = z.infer<typeof editRoleSchema>;
