import { z } from "zod";

export const editStaffProfileSchema = z.object({
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  maxConcurrentTickets: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(20, "Must be at most 20"),
  isAvailable: z.boolean(),
  skillTier: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(3, "Must be at most 3"),
  notes: z.string().max(500, "Must be at most 500 characters").optional(),
});

export const addSkillSchema = z.object({
  skillCode: z.string().min(1, "Skill code is required"),
  skillLevel: z
    .number()
    .int("Must be an integer")
    .min(1, "Must be at least 1")
    .max(5, "Must be at most 5"),
  certifiedUntil: z.string().optional(),
});

export type EditStaffProfileFormValues = z.infer<typeof editStaffProfileSchema>;
export type AddSkillFormValues = z.infer<typeof addSkillSchema>;
