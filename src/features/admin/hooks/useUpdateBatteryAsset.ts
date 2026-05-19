import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/shared/utils/queryKeys';
import { batteryAssetService } from '@/features/admin/services/battery-asset.service';
import type { UpdateBatteryAssetPayload } from '@/features/admin/types/battery-asset.types';

export function useUpdateBatteryAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBatteryAssetPayload) =>
      batteryAssetService.update(id, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
    },
  });
}
