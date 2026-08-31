import { z } from "zod";
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

export type InviteAccountFormValues = z.infer<typeof inviteAccountSchema>;
export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type EditAccountFormValues = z.infer<typeof editAccountSchema>;
