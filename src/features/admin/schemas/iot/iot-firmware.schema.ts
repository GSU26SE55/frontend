import { z } from "zod";
import { IotFirmwareChannelEnum } from "@/shared/enums/iot/iot.enum";

// 50MB = min of the 2 limits (upload-binary ≤60MB vs create-metadata ≤50MB). Since the FE runs a 2-step
// flow, we cap at 50MB to avoid a 50–60MB file landing in storage as junk and then failing with 400 at the create step.
const MAX_FIRMWARE_BYTES = 50_000_000;

export const uploadFirmwareSchema = z.object({
  file: z
    .instanceof(File, { message: "Select a firmware file" })
    .refine(
      (f) => f.name.toLowerCase().endsWith(".bin"),
      "File must have a .bin extension",
    )
    .refine((f) => f.size <= MAX_FIRMWARE_BYTES, "File must be at most 50MB"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Invalid SemVer (e.g. 1.2.3)"),
  hardwareRevision: z.string().min(1, "Required"),
  channel: z.nativeEnum(IotFirmwareChannelEnum).optional(),
  isRequired: z.boolean().optional(),
  publishImmediately: z.boolean().optional(),
  releaseNotes: z.string().optional(),
  deviceModel: z.string().optional(),
});

export type UploadFirmwareForm = z.infer<typeof uploadFirmwareSchema>;
