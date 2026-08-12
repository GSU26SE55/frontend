import { z } from "zod";

// Shared field validation — collects the rules repeated across many schemas
// (auth, admin). Each message is kept as-is so behaviour does not change.

/** Strong password regex: ≥8 characters with upper/lower/digit/special. */
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
export const PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a digit and a special character";

/** Vietnamese phone number regex. */
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
export const PHONE_MESSAGE = "Invalid phone number";

/** Email — used by login/register/forgot… */
export const emailField = z.string().email("Invalid email address");

/** Email with a length cap (change-email, reactivate). */
export const emailFieldMax = (
  max = 256,
  msg = "Email must be at most 256 characters",
) => z.string().email("Invalid email address").max(max, msg);

/** Strong password (register / forgot-password / accept-invite). */
export const passwordField = z.string().regex(PASSWORD_REGEX, PASSWORD_MESSAGE);

/** Strong password capped at 100 characters (change-password — BE caps at 100). */
export const passwordFieldBounded = z
  .string()
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE)
  .max(100, "Password must be at most 100 characters");

/** Full name, at least 2 characters. */
export const fullNameField = z
  .string()
  .min(2, "Full name must be at least 2 characters");

/** Vietnamese phone number (required). */
export const phoneField = z.string().regex(PHONE_REGEX, PHONE_MESSAGE);

/** Vietnamese phone number, optional (empty string allowed). */
export const optionalPhoneField = z
  .string()
  .regex(PHONE_REGEX, PHONE_MESSAGE)
  .optional()
  .or(z.literal(""));

/** 6-digit OTP — message varies per caller (2 wordings: "must be"/"contains"). */
export const otpField = (lengthMsg = "OTP must be exactly 6 digits") =>
  z
    .string()
    .length(6, lengthMsg)
    .regex(/^\d{6}$/, "OTP may only contain digits");

/** Coordinate string -> number within the allowed range (empty = skipped). */
export const coordField = (label: string, min: number, max: number) =>
  z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        v === "" ||
        (!isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    );

/** Date of birth as "yyyy-MM-dd" — optional, cannot be in the future. */
export const birthDateField = z
  .string()
  .optional()
  .refine(
    (v) => !v || new Date(v) <= new Date(),
    "Date of birth cannot be in the future",
  );
