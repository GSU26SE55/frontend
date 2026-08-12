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

// Notification list for the bell dropdown. `enabled` fetches only while the dropdown is open.
export const useNotifications = (params: NotificationsParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.notifications.list(params),
    queryFn: () => notificationService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
    enabled,
  });

// Inbox: infinite scroll instead of pagination. BE already returns `hasNextPage`, so
// getNextPageParam just increments pageNumber — no need to compute it from totalPages.
//
// Kept separate from useNotifications (bell dropdown) rather than shared: the bell fetches
// exactly the latest 10 items and only while open, while the inbox accumulates many pages.
// Merging them would mean opening the bell swallows the inbox's multi-page cache (or vice versa).
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

// Detail of a single notification for the right pane. Prefers the version already in the list
// cache as initialData → shows instantly on click, the background request only confirms/fills missing fields.
export const useNotificationDetail = (id: string | null) =>
  useQuery({
    queryKey: QUERY_KEY.notifications.detail(id ?? ""),
    queryFn: () => notificationService.getById(id!).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 30_000,
  });

// Unread count badge. Does NOT poll: useNotificationsRealtime receives the
// "UnreadCountChanged" event from the hub and writes the new number straight into this cache key.
// The fetch here only provides the initial value on mount + when returning to the tab
// (default refetchOnWindowFocus) to cover for events missed while the hub was down.
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

// User actively OPENS a notification (taps the deep link) — stronger signal than markRead, used to
// measure the push channel's real open rate. BE sets ReadAt itself, so no need to also call markRead.
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

export const useNotificationUnsubscribeGet = (token: string) =>
  useQuery({
    queryKey: [KEY.notifications, "unsubscribe", token],
    queryFn: () =>
      notificationService.getUnsubscribe(token).then((r) => r.data.data),
    enabled: !!token,
  });

export const useNotificationUnsubscribePost = () =>
  useMutation({
    mutationFn: (token: string) =>
      notificationService.unsubscribe(token).then((r) => r.data.data),
    onError: (error) => handleErrorApi({ error }),
  });
