import { z } from "zod";

export const editStaffProfileSchema = z.object({
  employeeCode: z.string().max(50, "Must be at most 50 characters").optional(),
  department: z.string().max(100, "Must be at most 100 characters").optional(),
  maxConcurrentTickets: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(50, "Must be at most 50"),
  isAvailable: z.boolean(),
  skillTier: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(3, "Must be at most 3"),
  // UpdateStaffProfileCommand allows 1000 — the 500 here rejected notes the BE accepts.
  notes: z.string().max(1000, "Must be at most 1000 characters").optional(),
});

export const addSkillSchema = z.object({
  skillCode: z
    .string()
    .min(1, "Skill code is required")
    .max(64, "Must be at most 64 characters"),
  skillLevel: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(5, "Must be at most 5"),
  certifiedUntil: z.string().optional(),
});

export type EditStaffProfileFormValues = z.infer<typeof editStaffProfileSchema>;
export type AddSkillFormValues = z.infer<typeof addSkillSchema>;
