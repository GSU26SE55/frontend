import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceService } from "@/features/admin/services/iot/iot-device.service";
import type { IotDeviceListParams } from "@/shared/types/iot/iot.types";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";

const PROVISION_STATUS_POLL_MS = 5_000;

export function useIotDevices(params?: IotDeviceListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotDevices.list(params),
    queryFn: () => iotDeviceService.getList(params).then((r) => r.data.data),
    refetchInterval: (query) =>
      query.state.data?.items.some(
        (device) => device.status === IotDeviceStatusEnum.Pending,
      )
        ? PROVISION_STATUS_POLL_MS
        : false,
  });
}
