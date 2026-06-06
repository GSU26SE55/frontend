import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  phoneNumber: z
    .string()
    .regex(/^(0[35789])[0-9]{8}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  timeZone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
