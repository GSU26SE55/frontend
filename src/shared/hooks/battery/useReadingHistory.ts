import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { sensorReadingService } from "@/shared/services/battery/sensor-reading.service";
import type { SensorReadingHistoryParams } from "@/shared/types/battery/sensor-reading-history.types";

// Nhịp tự tải lại. Thiết bị đẩy telemetry mỗi giây, nên không có nhịp này thì bảng chỉ nằm im
// theo mặc định toàn app (stale 2 phút, không refetch) và người xem tưởng thiết bị đã chết.
const REFRESH_MS = 30_000;

// Cursor pagination — no page-number, no totalItems. Used for the full history table.
export function useReadingHistory(
  assetId: string,
  params?: Omit<SensorReadingHistoryParams, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId, params),
    queryFn: ({ pageParam }) =>
      sensorReadingService
        .getHistory(assetId, { ...params, cursor: pageParam })
        .then((r) => r.data.data),
    enabled: !!assetId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    // LƯU Ý: useInfiniteQuery refetch LẠI TOÀN BỘ số trang đang giữ, không chỉ trang đầu. Cuộn
    // càng sâu thì mỗi nhịp càng nặng — đó là lý do để 30s chứ không ngắn hơn.
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
}

// List of the N most recent records (no infinite-scroll) — used for the summary panel
// in ticket detail (manager/staff). Previously duplicated as useManager/StaffReadingHistory.
export function useReadingHistoryLatest(
  assetId: string | null | undefined,
  limit = 10,
) {
  return useQuery({
    queryKey: QUERY_KEY.sensorReadings.history(assetId ?? "", { limit }),
    queryFn: () =>
      sensorReadingService
        .getHistory(assetId!, { limit })
        .then((r) => r.data.data),
    enabled: !!assetId,
    // Cùng nhịp với bảng lịch sử: lệch nhịp thì bảng tóm tắt và bảng đầy đủ hiển thị hai thời
    // điểm khác nhau trên cùng một màn hình.
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  });
}
