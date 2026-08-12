import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { iotFirmwareService } from "@/features/admin/services/iot/iot-firmware.service";
import { HttpError } from "@/shared/lib/errors";
import type { UploadFirmwareBinaryPayload } from "@/shared/types/iot/iot.types";

// 2 steps in 1 mutation: upload .bin → get artifactUrl/sha256/size → create release.
// upload-binary does NOT create a release, so createRelease must be called afterward.
export function useCreateFirmwareRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: UploadFirmwareBinaryPayload & { publishImmediately?: boolean },
    ) => {
      const uploaded = await iotFirmwareService
        .uploadBinary(payload)
        .then((r) => r.data);
      const artifact = uploaded.data;
      if (!artifact) {
        throw new HttpError(422, uploaded.message ?? "Firmware upload failed");
      }
      return iotFirmwareService
        .createRelease({
          version: payload.version,
          hardwareRevision: payload.hardwareRevision,
          artifactUrl: artifact.artifactUrl,
          sha256Checksum: artifact.sha256Checksum,
          artifactSizeBytes: artifact.artifactSizeBytes,
          releaseNotes: payload.releaseNotes,
          isRequired: payload.isRequired,
          channel: payload.channel,
          deviceModel: payload.deviceModel,
          publishImmediately: payload.publishImmediately,
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotFirmware] });
    },
  });
}

export function usePublishFirmwareRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      iotFirmwareService.publish(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotFirmware] });
    },
  });
}

export function useArchiveFirmwareRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      iotFirmwareService.archive(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotFirmware] });
    },
  });
}
