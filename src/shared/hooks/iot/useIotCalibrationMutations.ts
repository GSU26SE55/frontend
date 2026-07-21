import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { iotCalibrationService } from "@/shared/services/iot/iot-calibration.service";
import type { CreateCalibrationPayload } from "@/shared/types/iot/iot.types";

export function useCreateCalibration(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalibrationPayload) =>
      iotCalibrationService.create(deviceId, payload).then((r) => r.data),
    onSuccess: () => {
      // BE tự clear Redis iot:calibration:{deviceId}; FE invalidate cả list lẫn expiring.
      qc.invalidateQueries({ queryKey: [KEY.iotCalibrations] });
    },
  });
}

export function useDeleteCalibration(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (calibrationId: string) =>
      iotCalibrationService.delete(deviceId, calibrationId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotCalibrations] });
    },
  });
}
