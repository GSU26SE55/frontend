import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
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
  // The selected notification id lives in the URL (?id=) rather than only in state: an F5
  // refresh or sharing the link still opens the right notification, and the browser back
  // button behaves as expected.
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

  // Detail comes from its own endpoint, but if the item is already in the list it's used
  // as a temporary render → clicking shows something instantly, no "Loading…" flash between
  // selections.
  const { data: detail, isLoading: detailLoading } =
    useNotificationDetail(selectedId);
  const fallback = items.find((n) => n.id === selectedId);
  const selected = detail ?? fallback;

  // Infinite scroll via IntersectionObserver on a sentinel element at the end of the list.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        // isFetchingNextPage is read through this effect's closure; the effect re-runs
        // whenever the flag changes so the value is always fresh — no ref needed.
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = (id: string, unread: boolean) => {
    // replace: true — switching between notifications shouldn't push a new entry onto
    // history each time, otherwise back would need dozens of presses to leave the page.
    setSearchParams({ id }, { replace: true });
    if (unread) markRead.mutate(id);
  };

  // Arriving via deep link (?id= from the bell dropdown, or an F5/shared link) doesn't go
  // through handleSelect, so the notification previously stayed unread even though its
  // detail was already open. Mark it read exactly once per id.
  const autoReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId || !selected) return;
    if (autoReadRef.current === selectedId) return;
    if (!isUnreadStatus(selected.status)) return;
    autoReadRef.current = selectedId;
    markRead.mutate(selectedId);
    // markRead is a stable mutation across renders, deliberately left out of deps so
    // marking follows the selected id instead of re-running whenever the mutation
    // reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected]);

  // Scroll the selected item into view. Arriving from the bell, the item may be far down
  // the list (or not loaded yet) — without scrolling, the right side would show a detail
  // while the left side looks like nothing is selected.
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId, items.length]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Inbox</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "You've read all notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[12px] hover:bg-muted transition-colors disabled:opacity-50"
          >
            <CheckCheck size={13} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-11rem)]">
        {/* Left: infinite-scrolling list */}
        <div className="flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          <div className="flex gap-1 p-2 border-b border-border">
            {(
              [
                ["All", false],
                ["Unread", true],
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
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-muted-foreground">
                <Inbox size={24} strokeWidth={1.5} />
                <p className="text-xs">
                  {unreadOnly
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              <>
                {items.map((n) => {
                  const unread = isUnreadStatus(n.status);
                  return (
                    <button
                      key={n.id}
                      ref={n.id === selectedId ? selectedRowRef : undefined}
                      onClick={() => handleSelect(n.id, unread)}
                      aria-current={n.id === selectedId}
                      className={cn(
                        // border-l-2 is always present (transparent once read) so the text
                        // doesn't shift 2px each time an item becomes read.
                        "w-full text-left px-3.5 py-2.5 border-b border-border last:border-b-0 border-l-2 border-l-transparent hover:bg-muted transition-colors",
                        n.id === selectedId && "bg-muted",
                        // Unread: colored left bar + a stronger background. Keep both even
                        // when selected — previously the selected item's bg swallowed the
                        // unread marker.
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
                                locale: enUS,
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
                    Loading more…
                  </div>
                )}
                {!hasNextPage && items.length > 0 && (
                  <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
                    All notifications shown
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <NotificationDetailPane
            notification={selected}
            // Only show a loading state when there's NOTHING to render yet; if a version
            // from the list already exists, render it while the background request runs.
            isLoading={detailLoading && !selected}
          />
        </div>
      </div>
    </div>
  );
}
