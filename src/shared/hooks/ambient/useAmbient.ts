import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ambientService } from "@/shared/services/ambient/ambient.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  AmbientHistoryParams,
  AmbientThresholdListParams,
  AmbientThresholdUpsertPayload,
} from "@/shared/types/ambient/ambient.types";
import { MESSAGES } from "@/shared/constants/messages";

// Nhịp tự tải lại của màn hình môi trường. KHÔNG phải nhịp gửi của thiết bị (firmware đang gửi
// mỗi 15s) — mỗi nhịp có thể trễ tối đa một chu kỳ gửi, đổi lại còn nửa số request.
// Trước đây bảng để staleTime 5 phút và KHÔNG có refetchInterval vì dữ liệu môi trường lấy theo
// giờ từ weather API; từ khi cảm biến tự báo, giả định đó sai và bảng đứng im hàng phút.
const AMBIENT_REFRESH_MS = 30_000;
export const useAmbientHistory = (params: AmbientHistoryParams) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.history(params.siteId, params),
    queryFn: () => ambientService.getHistory(params).then((r) => r.data.data),
    enabled: !!params.siteId,
    staleTime: AMBIENT_REFRESH_MS,
    refetchInterval: AMBIENT_REFRESH_MS,
  });

// Ambient latest — the current temperature/humidity reading for the site, so it polls on the
// same 30s beat as useEnvironmentalIncidents, which is rendered beside it. The two disagreeing
// (an incident listed while the reading above still showed the pre-incident value) was the
// whole reason this widget looked wrong.
// retry:false — a site with no reading yet returns 404 (expected), no need to retry.
export const useAmbientLatest = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.latest(siteId),
    queryFn: () => ambientService.getLatest(siteId).then((r) => r.data.data),
    enabled: !!siteId,
    // Cùng nhịp với bảng lịch sử ngay bên dưới: lệch nhịp thì ô "mới nhất" và dòng đầu của bảng
    // hiển thị hai thời điểm khác nhau — đúng cái sai mà widget này từng mắc.
    staleTime: AMBIENT_REFRESH_MS,
    refetchInterval: AMBIENT_REFRESH_MS,
    retry: false,
  });

export const useAmbientThresholdList = (params?: AmbientThresholdListParams) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdList(params),
    queryFn: () =>
      ambientService.getThresholdList(params).then((r) => r.data.data),
    staleTime: 10 * 60_000,
  });

// Threshold by site — config UI: staleTime 10 minutes.
// Resolves to `null` for a site with no config yet: BE returns 200 with data = null for
// that case, so the form reads it as "create mode" from data rather than from isError.
// The `?? null` pins the resolved type — `undefined` would read as "no data" to React Query.
export const useAmbientThresholdBySite = (siteId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ambient.thresholdBySite(siteId),
    queryFn: () =>
      ambientService
        .getThresholdBySite(siteId)
        .then((r) => r.data.data ?? null),
    enabled: !!siteId,
    staleTime: 10 * 60_000,
    retry: false,
  });

// Form mutation — component handles the error via try-catch + handleErrorApi({error,setError}).
export const useUpsertAmbientThreshold = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AmbientThresholdUpsertPayload) =>
      ambientService.upsertThreshold(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [KEY.ambient] });
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ambient.thresholdBySite(variables.siteId),
      });
      toast.success(MESSAGES.ambient.thresholdSaved);
    },
  });
};
