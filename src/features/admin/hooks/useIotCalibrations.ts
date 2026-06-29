import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { iotCalibrationService } from "@/features/admin/services/iot-calibration.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  CreateCalibrationPayload,
  CalibrationListParams,
} from "@/shared/types/iot.types";

export const useIotCalibrations = (
  deviceId: string,
  params?: CalibrationListParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.iotCalibrations.list(deviceId, params),
    queryFn: () =>
      iotCalibrationService.getList(deviceId, params).then((r) => r.data.data),
    enabled: !!deviceId,
  });

export const useExpiringCalibrations = (within?: number) =>
  useQuery({
    queryKey: QUERY_KEY.iotCalibrations.expiring(within),
    queryFn: () =>
      iotCalibrationService.getExpiring(within).then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useCreateCalibration = (deviceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalibrationPayload) =>
      iotCalibrationService.create(deviceId, payload),
    onSuccess: () => {
      toast.success("Đã thêm calibration");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.iotCalibrations.list(deviceId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useDeleteCalibration = (deviceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (calibrationId: string) =>
      iotCalibrationService.remove(deviceId, calibrationId),
    onSuccess: () => {
      toast.success("Đã xóa calibration");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.iotCalibrations.list(deviceId),
      });
      qc.invalidateQueries({ queryKey: [KEY.iotCalibrations] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
