import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bmsSwitchService } from "@/shared/services/battery/bms-switch.service";
import type { SetBmsSwitchPayload } from "@/shared/types/battery/bms-switch.types";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

export function useSetBmsSwitch(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetBmsSwitchPayload) =>
      bmsSwitchService
        .setSwitch(assetId, payload)
        .then((response) => response.data.data!),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.batteryAssets.bmsSwitch(assetId),
      }),
  });
}
