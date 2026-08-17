import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { staffIotDeviceService } from "@/features/staff/services/iot/iot-device.service";

/**
 * Full device detail (incl. re-readable apiKey/QR/MQTT) — same shape Admin sees.
 *
 * `staleTime: 0` — these are security-sensitive secrets that can be rotated from ANOTHER
 * client (e.g. the mobile app). Without this, the default 2-minute staleTime lets a Staff
 * member open "View details" right after a mobile rotate and still see the old key.
 */
export function useIotDeviceDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.detail(id),
    queryFn: () => staffIotDeviceService.getById(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useRotateIotDeviceKey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => staffIotDeviceService.rotateKey(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

export function useRotateIotDeviceMqtt(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => staffIotDeviceService.rotateMqtt(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}
