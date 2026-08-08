import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotCalibrationService } from "@/shared/services/iot/iot-calibration.service";
import type { CalibrationListParams } from "@/shared/types/iot/iot.types";

export function useIotCalibrations(
  deviceId: string | undefined,
  params?: CalibrationListParams,
) {
  return useQuery({
    queryKey: QUERY_KEY.iotCalibrations.list(deviceId ?? "", params),
    queryFn: () =>
      iotCalibrationService.getList(deviceId!, params).then((r) => r.data.data),
    enabled: !!deviceId,
  });
}

export function useExpiringCalibrations(within?: number) {
  return useQuery({
    queryKey: QUERY_KEY.iotCalibrations.expiring(within),
    queryFn: () =>
      iotCalibrationService.getExpiring(within).then((r) => r.data.data),
  });
}

// Lookup deviceCode → device. Enabled only when a code is present (Staff submits input).
export function useDeviceByCode(deviceCode: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.byCode(deviceCode ?? ""),
    queryFn: () =>
      iotCalibrationService
        .lookupDeviceByCode(deviceCode!)
        .then((r) => r.data.data),
    enabled: !!deviceCode,
    retry: false, // 404 = not found → don't retry
  });
}
