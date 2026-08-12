import { z } from "zod";
import { emailField } from "@/shared/schemas/common.schema";

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
