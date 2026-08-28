import { z } from "zod";
import {
  fullNameField,
  optionalPhoneField,
  birthDateField,
} from "@/shared/schemas/common.schema";

export const profileSchema = z.object({
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  address: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional(),
  birthDate: birthDateField,
  timeZone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
