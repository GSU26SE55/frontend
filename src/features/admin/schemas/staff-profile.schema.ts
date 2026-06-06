import { z } from 'zod';

export const editStaffProfileSchema = z.object({
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  maxConcurrentTickets: z.number().int('Phải là số nguyên').min(1, 'Tối thiểu 1').max(20, 'Tối đa 20'),
  isAvailable: z.boolean(),
  notes: z.string().max(500, 'Tối đa 500 ký tự').optional(),
});

export const addSkillSchema = z.object({
  skillCode: z.string().min(1, 'Mã kỹ năng không được trống'),
  skillLevel: z.number().int('Phải là số nguyên').min(1, 'Tối thiểu 1').max(5, 'Tối đa 5'),
  certifiedUntil: z.string().optional(),
});

export type EditStaffProfileFormValues = z.infer<typeof editStaffProfileSchema>;
export type AddSkillFormValues = z.infer<typeof addSkillSchema>;
