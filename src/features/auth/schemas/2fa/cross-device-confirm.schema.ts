import { z } from "zod";

// #AUTH-51 step 2 — Device B confirm: 64-hex token + 6-digit TOTP.
// Matches the BE validation in ConfirmCrossDevice2FACommand.
export const crossDeviceConfirmSchema = z.object({
  confirmToken: z
    .string()
    .length(64, "Invalid token")
    .regex(/^[0-9a-fA-F]{64}$/, "Invalid token"),
  totpCode: z
    .string()
    .length(6, "TOTP code must be 6 digits")
    .regex(/^\d{6}$/, "TOTP code may only contain digits"),
});
export type CrossDeviceConfirmFormValues = z.infer<
  typeof crossDeviceConfirmSchema
>;
