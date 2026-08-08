import { z } from "zod";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

// apiKeyScopes is a bitmask — a combo (e.g. 1|2=3) is NOT an enum member, so we use z.number instead of nativeEnum.
const apiKeyScopes = z
  .number()
  .int()
  .refine((v) => v !== 0, "Select at least 1 scope")
  .optional();

export const createIotDeviceSchema = z.object({
  deviceCode: z
    .string()
    .min(3, "Must be at least 3 characters")
    .max(64, "Must be at most 64 characters")
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, digits, and hyphens"),
  displayName: z
    .string()
    .min(1, "Required")
    .max(200, "Must be at most 200 characters"),
  siteId: z.string().uuid("Select a site"),
  hardwareRevision: z
    .string()
    .max(64, "Must be at most 64 characters")
    .optional(),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Must be at least 10 seconds")
    .max(3600, "Must be at most 3600 seconds")
    .optional(),
  notes: z.string().max(1000, "Must be at most 1000 characters").optional(),
});

export const updateIotDeviceSchema = z.object({
  displayName: z
    .string()
    .min(1, "Required")
    .max(200, "Must be at most 200 characters"),
  siteId: z.string().uuid("Select a site"),
  hardwareRevision: z
    .string()
    .max(64, "Must be at most 64 characters")
    .optional(),
  status: z.nativeEnum(IotDeviceStatusEnum),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Must be at least 10 seconds")
    .max(3600, "Must be at most 3600 seconds")
    .optional(),
  targetFirmwareReleaseId: z.string().uuid().optional(),
  notes: z.string().max(1000, "Must be at most 1000 characters").optional(),
});

// Command `type` is free-form; `params` is a JSON string in the form → JSON.parse on submit (parse failure → setError).
export const deviceCommandSchema = z.object({
  type: z.string().min(1, "Required"),
  params: z.string().optional(),
  cmdId: z.string().optional(),
});

export type CreateIotDeviceForm = z.infer<typeof createIotDeviceSchema>;
export type UpdateIotDeviceForm = z.infer<typeof updateIotDeviceSchema>;
export type DeviceCommandForm = z.infer<typeof deviceCommandSchema>;
