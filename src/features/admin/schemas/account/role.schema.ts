import { z } from "zod";
import { RoleStatusEnum } from "@/features/admin/types/account/admin.types";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Must be at most 50 characters"),
  description: z.string().max(200, "Must be at most 200 characters").optional(),
});

export const editRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Must be at most 50 characters"),
  description: z.string().max(200, "Must be at most 200 characters").optional(),
});

export const changeRoleStatusSchema = z.object({
  status: z.nativeEnum(RoleStatusEnum),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
export type EditRoleFormValues = z.infer<typeof editRoleSchema>;
export type ChangeRoleStatusFormValues = z.infer<typeof changeRoleStatusSchema>;
