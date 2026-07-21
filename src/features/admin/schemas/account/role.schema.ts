import { z } from "zod";
import { RoleStatusEnum } from "@/features/admin/types/account/admin.types";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Tên role tối thiểu 2 ký tự")
    .max(50, "Tối đa 50 ký tự"),
  description: z.string().max(200, "Tối đa 200 ký tự").optional(),
});

export const editRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Tên role tối thiểu 2 ký tự")
    .max(50, "Tối đa 50 ký tự"),
  description: z.string().max(200, "Tối đa 200 ký tự").optional(),
});

export const changeRoleStatusSchema = z.object({
  status: z.nativeEnum(RoleStatusEnum),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
export type EditRoleFormValues = z.infer<typeof editRoleSchema>;
export type ChangeRoleStatusFormValues = z.infer<typeof changeRoleStatusSchema>;
