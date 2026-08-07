import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notificationService } from "@/shared/services/notification/notification.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { NotificationsParams } from "@/shared/types/notification/notification.types";

// List notification cho dropdown bell. `enabled` để chỉ fetch khi dropdown mở.
export const useNotifications = (params: NotificationsParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.notifications.list(params),
    queryFn: () => notificationService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
    enabled,
  });

// Hộp thư: cuộn vô hạn thay vì phân trang. BE trả `hasNextPage` sẵn nên
// getNextPageParam chỉ cần tăng pageNumber — không cần tự tính theo totalPages.
//
// Tách khỏi useNotifications (dropdown bell) chứ không dùng chung: bell lấy đúng 10 mục
// mới nhất và chỉ fetch khi mở, còn hộp thư giữ nhiều trang tích lũy. Gộp lại thì
// mở bell sẽ nuốt nguyên cache nhiều trang của hộp thư (hoặc ngược lại).
export const useNotificationsInfinite = (
  params: Omit<NotificationsParams, "pageNumber"> = {},
) =>
  useInfiniteQuery({
    queryKey: QUERY_KEY.notifications.infinite(params),
    queryFn: ({ pageParam }) =>
      notificationService
        .getList({ ...params, pageNumber: pageParam })
        .then((r) => r.data.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    staleTime: 30_000,
  });

// Chi tiết 1 noti cho pane bên phải. Ưu tiên dùng bản đã có trong cache list làm
// initialData → click là hiện ngay, request nền chỉ để xác nhận/bù field thiếu.
export const useNotificationDetail = (id: string | null) =>
  useQuery({
    queryKey: QUERY_KEY.notifications.detail(id ?? ""),
    queryFn: () => notificationService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });

// Badge số chưa đọc. KHÔNG poll: useNotificationsRealtime nhận event
// "UnreadCountChanged" từ hub và ghi thẳng số mới vào cache key này.
// Fetch ở đây chỉ còn là giá trị khởi tạo lúc mount + lúc quay lại tab
// (refetchOnWindowFocus mặc định) để bù event lỡ khi hub rớt.
export const useUnreadCount = () =>
  useQuery({
    queryKey: QUERY_KEY.notifications.unreadCount(),
    queryFn: () =>
      notificationService.getUnreadCount().then((r) => r.data.data ?? 0),
    staleTime: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// User chủ động MỞ notification (bấm deep link) — mạnh hơn markRead, dùng để đo
// open-rate thật của kênh push. BE tự set ReadAt nên KHÔNG cần gọi kèm markRead.
export const useMarkNotificationOpened = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markOpened(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
