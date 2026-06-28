import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceService } from "@/features/admin/services/iot-device.service";

export function useIotDevice(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.detail(id ?? ""),
    queryFn: () => iotDeviceService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });
}
