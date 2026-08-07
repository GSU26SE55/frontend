import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  useNotificationsInfinite,
  useNotificationDetail,
  useMarkNotificationRead,
  useMarkAllRead,
  useUnreadCount,
} from "@/shared/hooks/notifications/useNotifications";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import { notificationTypeLabel } from "@/shared/constants/notificationLabels";
import NotificationDetailPane from "@/shared/components/notification/NotificationDetailPane";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function NotificationInboxPage() {
  // Id noti đang chọn nằm ở URL (?id=) chứ không chỉ trong state: F5 hoặc gửi link cho
  // người khác vẫn mở đúng thông báo đó, và nút back của trình duyệt hoạt động như mong đợi.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const params = useMemo(
    () => ({
      pageSize: PAGE_SIZE,
      ...(unreadOnly ? { unreadOnly: true } : {}),
    }),
    [unreadOnly],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotificationsInfinite(params);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const items = useMemo(
    () => data?.pages.flatMap((p) => p?.items ?? []) ?? [],
    [data],
  );

  // Detail lấy từ endpoint riêng, nhưng mục đã có trong list thì dùng luôn làm bản
  // hiển thị tạm → click là thấy ngay, không nháy "Đang tải…" giữa các lần chọn.
  const { data: detail, isLoading: detailLoading } =
    useNotificationDetail(selectedId);
  const fallback = items.find((n) => n.id === selectedId);
  const selected = detail ?? fallback;

  // Cuộn vô hạn bằng IntersectionObserver trên phần tử canh cuối danh sách.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        // isFetchingNextPage đọc qua closure của effect này; effect chạy lại mỗi khi cờ
        // đổi nên giá trị luôn mới — không cần ref.
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = (id: string, unread: boolean) => {
    // replace: true — chọn qua lại giữa các noti không nên nhồi mỗi lần một entry vào
    // history, nếu không bấm back phải bấm hàng chục lần mới thoát được trang.
    setSearchParams({ id }, { replace: true });
    if (unread) markRead.mutate(id);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Hộp thư</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} thông báo chưa đọc`
              : "Bạn đã đọc hết thông báo"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[12px] hover:bg-muted transition-colors disabled:opacity-50"
          >
            <CheckCheck size={13} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-11rem)]">
        {/* Trái: danh sách cuộn vô hạn */}
        <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-border">
            {(
              [
                ["Tất cả", false],
                ["Chưa đọc", true],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                onClick={() => setUnreadOnly(value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] transition-colors",
                  unreadOnly === value
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div
                role="status"
                className="px-4 py-8 text-center text-xs text-muted-foreground"
              >
                Đang tải…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-muted-foreground">
                <Inbox size={24} strokeWidth={1.5} />
                <p className="text-xs">
                  {unreadOnly
                    ? "Không có thông báo chưa đọc"
                    : "Chưa có thông báo"}
                </p>
              </div>
            ) : (
              <>
                {items.map((n) => {
                  const unread = isUnreadStatus(n.status);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleSelect(n.id, unread)}
                      aria-current={n.id === selectedId}
                      className={cn(
                        // border-l-2 luôn có (trong suốt khi đã đọc) để chữ không bị xê dịch
                        // 2px mỗi lần một mục chuyển sang đã đọc.
                        "w-full text-left px-3.5 py-2.5 border-b border-border last:border-b-0 border-l-2 border-l-transparent hover:bg-muted transition-colors",
                        n.id === selectedId && "bg-muted",
                        // Chưa đọc: vạch màu bên trái + nền đậm hơn. Giữ cả hai kể cả khi
                        // đang được chọn — trước đây bg của mục chọn nuốt mất dấu chưa đọc.
                        unread && "border-l-primary",
                        unread && n.id !== selectedId && "bg-primary/10",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {unread && (
                          <span
                            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: "var(--p1)" }}
                          />
                        )}
                        <div
                          className={cn("flex-1 min-w-0", !unread && "pl-3.5")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "text-[10px] truncate",
                                unread
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                              {notificationTypeLabel(n.type)}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(n.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "text-[12.5px] truncate text-foreground",
                              unread ? "font-semibold" : "font-medium",
                            )}
                          >
                            {n.title}
                          </div>
                          <div
                            className={cn(
                              "text-[11.5px] line-clamp-1",
                              unread
                                ? "text-foreground/80"
                                : "text-muted-foreground",
                            )}
                          >
                            {n.body}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div ref={sentinelRef} />
                {isFetchingNextPage && (
                  <div
                    role="status"
                    className="px-4 py-3 text-center text-[11px] text-muted-foreground"
                  >
                    Đang tải thêm…
                  </div>
                )}
                {!hasNextPage && items.length > 0 && (
                  <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
                    Đã hiển thị toàn bộ thông báo
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Phải: chi tiết */}
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <NotificationDetailPane
            notification={selected}
            // Chỉ hiện trạng thái tải khi CHƯA có gì để vẽ; đã có bản từ list thì
            // vẽ luôn trong lúc request nền chạy.
            isLoading={detailLoading && !selected}
          />
        </div>
      </div>
    </div>
  );
}
