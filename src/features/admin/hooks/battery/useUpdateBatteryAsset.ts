import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY } from "@/shared/utils/queryKeys";
import { batteryAssetService } from "@/features/admin/services/battery/battery-asset.service";
import type { UpdateBatteryAssetPayload } from "@/features/admin/types/battery/battery-asset.types";

export function useUpdateBatteryAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBatteryAssetPayload) =>
      batteryAssetService.update(id, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
      // Editing a battery may change its site → both the old and new site's battery lists must reload.
      qc.invalidateQueries({ queryKey: [KEY.sites] });
    },
  });
}
