import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/shared/utils/queryKeys';
import { batteryAssetService } from '@/features/admin/services/battery-asset.service';

export function useBatteryAsset(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.batteryAssets.detail(id),
    queryFn: () => batteryAssetService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}
