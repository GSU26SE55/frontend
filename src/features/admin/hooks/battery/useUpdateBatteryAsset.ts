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
      // Sửa pin có thể đổi site → danh sách pin của site cũ/mới đều phải load lại.
      qc.invalidateQueries({ queryKey: [KEY.sites] });
    },
  });
}
