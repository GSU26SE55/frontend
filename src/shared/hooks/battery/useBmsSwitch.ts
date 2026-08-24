import { useQuery } from "@tanstack/react-query";
import { bmsSwitchService } from "@/shared/services/battery/bms-switch.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export function useBmsSwitch(assetId: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.bmsSwitch(assetId),
    queryFn: () =>
      bmsSwitchService.getState(assetId).then((response) => response.data.data),
    enabled: !!assetId,
    staleTime: 0,
    retry: false,
    // Command lifecycle: MQTT to the device, Modbus write and readback in firmware
    // (~200-400ms), then an acknowledgement returns. The previous 3s interval made
    // the control appear slow after the BMS had already applied the state. Poll every
    // 400ms only while a command is pending to track the actual device latency.
    refetchInterval: (query) =>
      query.state.data?.pendingCommand ? 400 : 30_000,
  });
}
