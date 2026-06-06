import { z } from "zod";
import { AccountStatusEnum } from "@/shared/types/account.types";

const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
const phoneRegex = /^(0[35789])[0-9]{8}$/;

export const inviteAccountSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  roleId: z.string().min(1, "Cần chọn role"),
});

export const createAccountSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      ),
    confirmPassword: z.string(),
    phoneNumber: z
      .string()
      .regex(phoneRegex, "Số điện thoại không hợp lệ")
      .optional()
      .or(z.literal("")),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    roleId: z.string().min(1, "Cần chọn role"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export const editAccountSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional(),
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
