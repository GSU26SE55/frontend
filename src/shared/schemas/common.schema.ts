import { z } from "zod";

// Field validation dùng chung — gom các rule lặp ở nhiều schema (auth, admin).
// Giữ nguyên message hiện tại của từng nơi để không đổi behavior.

/** Regex mật khẩu mạnh: ≥8 ký tự, có hoa/thường/số/ký tự đặc biệt. */
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
export const PASSWORD_MESSAGE =
  "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";

/** Regex số điện thoại VN. */
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
export const PHONE_MESSAGE = "Số điện thoại không hợp lệ";

/** Email — dùng cho login/register/forgot... */
export const emailField = z.string().email("Email không hợp lệ");

/** Email có giới hạn độ dài (change-email, reactivate). */
export const emailFieldMax = (max = 256, msg = "Email tối đa 256 ký tự") =>
  z.string().email("Email không hợp lệ").max(max, msg);

/** Mật khẩu mạnh (register / forgot-password / accept-invite). */
export const passwordField = z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

/** Mật khẩu mạnh + giới hạn max 100 ký tự (change-password — BE giới hạn 100). */
export const passwordFieldBounded = z
  .string()
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE)
  .max(100, "Mật khẩu tối đa 100 ký tự");

/** Họ tên tối thiểu 2 ký tự. */
export const fullNameField = z.string().min(2, "Họ tên tối thiểu 2 ký tự");

/** Số điện thoại VN (bắt buộc). */
export const phoneField = z.string().regex(PHONE_REGEX, PHONE_MESSAGE);

/** Số điện thoại VN không bắt buộc (cho phép rỗng). */
export const optionalPhoneField = z
  .string()
  .regex(PHONE_REGEX, PHONE_MESSAGE)
  .optional()
  .or(z.literal(""));

/** OTP 6 chữ số — message tuỳ nơi (2 biến thể "phải đúng"/"gồm"). */
export const otpField = (lengthMsg = "OTP phải đúng 6 chữ số") =>
  z
    .string()
    .length(6, lengthMsg)
    .regex(/^\d{6}$/, "OTP chỉ gồm chữ số");

/** Chuỗi toạ độ -> số trong khoảng cho phép (rỗng = bỏ qua). */
export const coordField = (label: string, min: number, max: number) =>
  z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        v === "" ||
        (!isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} phải trong khoảng ${min} đến ${max}`,
    );
