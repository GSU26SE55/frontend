import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/shared/utils/queryKeys';
import { batteryAssetService } from '@/features/admin/services/battery-asset.service';
import type { BatteryAssetListParams } from '@/features/admin/types/battery-asset.types';

export function useBatteryAssets(params?: BatteryAssetListParams) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.list(params),
    queryFn: () => batteryAssetService.getList(params).then((r) => r.data.data),
  });
}
