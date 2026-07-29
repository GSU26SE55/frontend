import { z } from "zod";
import { AccountStatusEnum } from "@/shared/types/account/account.types";
import {
  emailField,
  fullNameField,
  optionalPhoneField,
  passwordField,
  birthDateField,
} from "@/shared/schemas/common.schema";

export const inviteAccountSchema = z.object({
  email: emailField,
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  roleId: z.string().min(1, "Cần chọn role"),
});

export const createAccountSchema = z
  .object({
    email: emailField,
    fullName: fullNameField,
    password: passwordField,
    confirmPassword: z.string(),
    phoneNumber: optionalPhoneField,
    dateOfBirth: birthDateField,
    address: z.string().optional(),
    roleId: z.string().min(1, "Cần chọn role"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export const editAccountSchema = z.object({
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  dateOfBirth: birthDateField,
  address: z.string().optional(),
});

export const changeAccountStatusSchema = z.object({
  status: z.nativeEnum(AccountStatusEnum),
  reason: z.string().optional(),
});

export const changeAccountRoleSchema = z.object({
  roleId: z.string().min(1, "Cần chọn role"),
});

export type InviteAccountFormValues = z.infer<typeof inviteAccountSchema>;
export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type EditAccountFormValues = z.infer<typeof editAccountSchema>;
export type ChangeAccountStatusFormValues = z.infer<
  typeof changeAccountStatusSchema
>;
export type ChangeAccountRoleFormValues = z.infer<
  typeof changeAccountRoleSchema
>;
