import { z } from "zod";
import {
  fullNameField,
  optionalPhoneField,
} from "@/shared/schemas/common.schema";

export const profileSchema = z.object({
  fullName: fullNameField,
  phoneNumber: optionalPhoneField,
  address: z.string().optional(),
  birthDate: z.string().optional(),
  timeZone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
