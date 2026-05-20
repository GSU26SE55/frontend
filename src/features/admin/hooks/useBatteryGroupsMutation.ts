import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY, QUERY_KEY } from '@/shared/utils/queryKeys';
import { batteryGroupService } from '@/features/admin/services/battery-group.service';
import { handleErrorApi } from '@/shared/lib/errors';
import type {
  CreateBatteryGroupPayload,
  UpdateBatteryGroupPayload,
} from '@/features/admin/types/battery-group.types';

export function useCreateBatteryGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBatteryGroupPayload) =>
      batteryGroupService.create(payload).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY.batteryGroups] }); },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useUpdateBatteryGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBatteryGroupPayload) =>
      batteryGroupService.update(id, payload).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY.batteryGroups] }); },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeleteBatteryGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batteryGroupService.delete(id).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [KEY.batteryGroups] });
      qc.removeQueries({ queryKey: QUERY_KEY.batteryGroups.detail(id) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useRestoreBatteryGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batteryGroupService.restore(id).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY.batteryGroups] }); },
    onError: (error) => handleErrorApi({ error }),
  });
}
