import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { batteryTypeService } from "@/features/admin/services/battery/battery-type.service";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  CreateBatteryTypePayload,
  UpdateBatteryTypePayload,
} from "@/features/admin/types/battery/battery-type.types";

// Form-bound mutation: do NOT set onError here — the form catches it itself + setError (avoids a double toast)
export function useCreateBatteryType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBatteryTypePayload) =>
      batteryTypeService.create(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryTypes] });
    },
  });
}

export function useUpdateBatteryType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBatteryTypePayload) =>
      batteryTypeService.update(id, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryTypes] });
    },
  });
}

export function useDeleteBatteryType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      batteryTypeService.delete(id).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [KEY.batteryTypes] });
      qc.removeQueries({ queryKey: QUERY_KEY.batteryTypes.detail(id) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useRestoreBatteryType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      batteryTypeService.restore(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.batteryTypes] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
