import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotFirmwareService } from "@/features/admin/services/iot/iot-firmware.service";
import type { FirmwareReleaseListParams } from "@/shared/types/iot/iot.types";

export function useIotFirmware(params?: FirmwareReleaseListParams) {
  return useQuery({
    queryKey: QUERY_KEY.iotFirmware.list(params),
    queryFn: () => iotFirmwareService.getList(params).then((r) => r.data.data),
  });
}
