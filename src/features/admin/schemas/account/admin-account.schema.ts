import { z } from "zod";
import { AccountStatusEnum } from "@/shared/types/account/account.types";
import {
  emailField,
  fullNameField,
  optionalPhoneField,
  passwordField,
  birthDateField,
  addressField,
  roleIdField,
} from "@/shared/schemas/common.schema";

export const inviteAccountSchema = z.object({
  email: emailField,
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  roleId: roleIdField,
});

export const createAccountSchema = z
  .object({
    email: emailField,
    fullName: fullNameField,
    password: passwordField,
    confirmPassword: z.string(),
    phoneNumber: optionalPhoneField,
    dateOfBirth: birthDateField,
    address: addressField,
    roleId: roleIdField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const editAccountSchema = z.object({
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  dateOfBirth: birthDateField,
  address: addressField,
});

export const changeAccountStatusSchema = z.object({
  status: z.nativeEnum(AccountStatusEnum),
  // ChangeAccountStatusCommand caps this at 500 — without the rule the admin writes the
  // whole justification and only then gets a 400.
  reason: z
    .string()
    .max(500, "Reason must be at most 500 characters")
    .optional(),
});

export type InviteAccountFormValues = z.infer<typeof inviteAccountSchema>;
export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type EditAccountFormValues = z.infer<typeof editAccountSchema>;
export type ChangeAccountStatusFormValues = z.infer<
  typeof changeAccountStatusSchema
>;
