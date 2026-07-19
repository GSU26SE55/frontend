import { z } from "zod";
import { IotFirmwareChannelEnum } from "@/shared/enums/iot/iot.enum";

// 50MB = min của 2 giới hạn (upload-binary ≤60MB vs create-metadata ≤50MB). Vì FE chạy 2-step
// nên chặn ở 50MB để tránh file 50–60MB lên storage thành rác rồi fail 400 ở bước create.
const MAX_FIRMWARE_BYTES = 50_000_000;

export const uploadFirmwareSchema = z.object({
  file: z
    .instanceof(File, { message: "Cần chọn file firmware" })
    .refine(
      (f) => f.name.toLowerCase().endsWith(".bin"),
      "File phải có đuôi .bin",
    )
    .refine((f) => f.size <= MAX_FIRMWARE_BYTES, "File tối đa 50MB"),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "SemVer không hợp lệ (vd 1.2.3)"),
  hardwareRevision: z.string().min(1, "Bắt buộc"),
  channel: z.nativeEnum(IotFirmwareChannelEnum).optional(),
  isRequired: z.boolean().optional(),
  publishImmediately: z.boolean().optional(),
  releaseNotes: z.string().optional(),
  deviceModel: z.string().optional(),
});

export type UploadFirmwareForm = z.infer<typeof uploadFirmwareSchema>;
