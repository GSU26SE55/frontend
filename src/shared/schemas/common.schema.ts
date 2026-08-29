import { z } from "zod";

// Shared field validation — collects the rules repeated across many schemas
// (auth, admin). Each message is kept as-is so behaviour does not change.

/**
 * Minimum password length, mirroring `PasswordPolicyOptions.MinLength` on the BE.
 *
 * The BE default is 8 but production overrides the `PasswordPolicy` section to 12. The FE has
 * no endpoint to read the live policy from, so the number is mirrored here — keep it in sync
 * with the deployed config, and derive both the regex and the message from it so the rule the
 * user reads can never drift from the rule the form enforces.
 */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Strong password regex: ≥PASSWORD_MIN_LENGTH characters with upper/lower/digit/special.
 *
 * The special-character class mirrors the BE (`!char.IsLetterOrDigit && !char.IsWhiteSpace`)
 * rather than a short handpicked list — `Abcdefg1_` is accepted by the BE, so the FE must not
 * reject it.
 */
export const PASSWORD_REGEX = new RegExp(
  `^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{${PASSWORD_MIN_LENGTH},}$`,
);
export const PASSWORD_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, a lowercase letter, a digit and a special character`;
/** BE caps every password at 100 characters (PasswordPolicy.MaxLength). */
export const PASSWORD_MAX_LENGTH = 100;
export const PASSWORD_MAX_MESSAGE = "Password must be at most 100 characters";

/** Vietnamese mobile number regex — mirrored by AccountFieldPolicy.PhoneRegex on the BE. */
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
export const PHONE_MESSAGE = "Invalid phone number";

/**
 * Email — used by login/register/forgot…
 *
 * `.min(1)` runs before `.email()` so an empty box reports "Email is required" instead of
 * "Invalid email address" — the password field beside it already said "Password is required",
 * so the two halves of the same form disagreed on what an empty field means.
 */
export const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(256, "Email must be at most 256 characters");

/** Email with a length cap (change-email, reactivate). */
export const emailFieldMax = (
  max = 256,
  msg = "Email must be at most 256 characters",
) =>
  z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(max, msg);

/** Strong password — matches the BE policy, 100-character cap included. */
export const passwordField = z
  .string()
  .regex(PASSWORD_REGEX, PASSWORD_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_MAX_MESSAGE);

/** @deprecated `passwordField` now carries the same 100-character cap. */
export const passwordFieldBounded = passwordField;

/** Full name, 2–150 characters — same bounds as AccountFieldPolicy on the BE. */
export const fullNameField = z
  .string()
  .min(2, "Full name must be at least 2 characters")
  .max(150, "Full name must be at most 150 characters");

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

/**
 * A required <Select>/<Controller> field.
 *
 * An untouched select holds `undefined`, and a bare `z.nativeEnum()`/`z.string()` reports
 * Zod's built-in "Invalid input: expected string, received undefined" — internal wording
 * that means nothing to the person filling in the form. Wrapping the field carries the
 * authored message through the missing case as well, so the form is correct even when the
 * consumer forgets `defaultValues`.
 */
export const requiredSelect = <T extends z.ZodTypeAny>(
  schema: T,
  message = "This field is required",
) =>
  z
    .union([schema, z.undefined(), z.literal("")])
    // A plain boolean predicate, not a `v is z.infer<T>` type guard: TS cannot prove the
    // narrowed type is assignable to the union's output, and `.pipe(schema)` re-validates
    // against the real schema anyway, so the guard bought nothing but a compile error.
    .refine((v) => v !== undefined && v !== "", message)
    // The refine above has already rejected undefined/"", so by here the value is a valid
    // input to `schema` — but that is a runtime fact TS cannot see through the union, so the
    // pipe target is cast. `.pipe` (rather than a transform) is what makes the inferred output
    // the schema's own type, which is what react-hook-form binds the form values to.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .pipe(schema as any) as unknown as z.ZodType<z.infer<T>, z.input<T>>;

/**
 * A required numeric input that may start empty.
 *
 * Same problem as {@link requiredSelect}: an untouched number input holds `undefined`
 * (or `""` once cleared) and a bare `z.number()` reports "expected number, received
 * undefined" instead of a sentence the user can act on.
 */
export const requiredNumber = <T extends z.ZodTypeAny>(
  schema: T,
  message = "This field is required",
) =>
  z
    .union([schema, z.undefined(), z.nan(), z.literal("")])
    .refine(
      // Plain predicate for the same reason as requiredSelect above.
      (v) =>
        v !== undefined &&
        v !== "" &&
        !(typeof v === "number" && Number.isNaN(v)),
      message,
    )
    // Same reasoning as requiredSelect.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .pipe(schema as any) as unknown as z.ZodType<z.infer<T>, z.input<T>>;

/** Address — optional, capped at 500 characters like AccountFieldPolicy on the BE. */
export const addressField = z
  .string()
  .max(500, "Address must be at most 500 characters")
  .optional();

/**
 * Role id — the BE binds it into a `Guid`, so a non-GUID string never reaches the validator:
 * ASP.NET rejects it at model binding with an error the form cannot attach to a field.
 * Validating the shape here keeps the message on the select.
 */
export const roleIdField = z
  .string({ error: "Select a role" })
  .uuid("Select a role");

/** BE rejects any birth year before this (AccountFieldPolicy.MinBirthYear). */
export const MIN_BIRTH_YEAR = 1900;

/** Date of birth as "yyyy-MM-dd" — optional, cannot be in the future or before 1900. */
export const birthDateField = z
  .string()
  .optional()
  .refine(
    (v) => !v || new Date(v) <= new Date(),
    "Date of birth cannot be in the future",
  )
  .refine(
    (v) => !v || new Date(v).getFullYear() >= MIN_BIRTH_YEAR,
    `Date of birth must be from ${MIN_BIRTH_YEAR} onwards`,
  );
