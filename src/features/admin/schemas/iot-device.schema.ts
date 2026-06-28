import { z } from "zod";
import { IotDeviceStatusEnum } from "@/shared/enums/iot.enum";

// apiKeyScopes là bitmask — combo (vd 1|2=3) KHÔNG phải member enum nên dùng z.number, không nativeEnum.
const apiKeyScopes = z
  .number()
  .int()
  .refine((v) => v !== 0, "Cần chọn ít nhất 1 scope")
  .optional();

export const createIotDeviceSchema = z.object({
  deviceCode: z
    .string()
    .min(3, "Tối thiểu 3 ký tự")
    .max(64, "Tối đa 64 ký tự")
    .regex(/^[A-Z0-9-]+$/, "Chỉ chữ hoa, số và dấu gạch ngang"),
  displayName: z.string().min(1, "Bắt buộc").max(200, "Tối đa 200 ký tự"),
  siteId: z.string().uuid("Cần chọn site"),
  hardwareRevision: z.string().max(64, "Tối đa 64 ký tự").optional(),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Tối thiểu 10 giây")
    .max(3600, "Tối đa 3600 giây")
    .optional(),
  notes: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

export const updateIotDeviceSchema = z.object({
  displayName: z.string().min(1, "Bắt buộc").max(200, "Tối đa 200 ký tự"),
  siteId: z.string().uuid("Cần chọn site"),
  hardwareRevision: z.string().max(64, "Tối đa 64 ký tự").optional(),
  status: z.nativeEnum(IotDeviceStatusEnum),
  apiKeyScopes,
  heartbeatIntervalSeconds: z
    .number()
    .int()
    .min(10, "Tối thiểu 10 giây")
    .max(3600, "Tối đa 3600 giây")
    .optional(),
  targetFirmwareReleaseId: z.string().uuid().optional(),
  notes: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
});

// Command `type` tự do; `params` là string JSON ở form → JSON.parse khi submit (parse fail → setError).
export const deviceCommandSchema = z.object({
  type: z.string().min(1, "Bắt buộc"),
  params: z.string().optional(),
  cmdId: z.string().optional(),
});

export type CreateIotDeviceForm = z.infer<typeof createIotDeviceSchema>;
export type UpdateIotDeviceForm = z.infer<typeof updateIotDeviceSchema>;
export type DeviceCommandForm = z.infer<typeof deviceCommandSchema>;
