import { z } from "zod";

// #AUTH-51 bước 2 — Device B confirm: token 64 hex + TOTP 6 số.
// Khớp validation BE ConfirmCrossDevice2FACommand.
export const crossDeviceConfirmSchema = z.object({
  confirmToken: z
    .string()
    .length(64, "Token không hợp lệ")
    .regex(/^[0-9a-fA-F]{64}$/, "Token không hợp lệ"),
  totpCode: z
    .string()
    .length(6, "Mã TOTP gồm 6 chữ số")
    .regex(/^\d{6}$/, "Mã TOTP chỉ gồm chữ số"),
});
export type CrossDeviceConfirmFormValues = z.infer<
  typeof crossDeviceConfirmSchema
>;
