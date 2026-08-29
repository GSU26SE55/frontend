import { z } from "zod";
import {
  fullNameField,
  optionalPhoneField,
  birthDateField,
  addressField,
} from "@/shared/schemas/common.schema";

export const profileSchema = z.object({
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  address: addressField,
  birthDate: birthDateField,
  // UpdateMyProfileCommand caps TimeZone at 100 characters.
  timeZone: z
    .string()
    .max(100, "Time zone must be at most 100 characters")
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
