import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceService } from "@/features/admin/services/iot/iot-device.service";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const LIVE_STATUS_POLL_MS = 5_000;

export function useIotDevice(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.detail(id ?? ""),
    queryFn: () => iotDeviceService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
    // Provision, MQTT LWT and recovery all happen outside the browser. Active and
    // Offline therefore remain live states; stopping after Active left the badge
    // stale forever when an ESP32 lost power.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status != null &&
        status !== IotDeviceStatusEnum.Disabled &&
        status !== IotDeviceStatusEnum.Decommissioned
        ? LIVE_STATUS_POLL_MS
        : false;
    },
  });
}
