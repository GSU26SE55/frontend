import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  createNotificationConnection,
  isLive,
  type HubConnection,
} from "@/shared/lib/signalr";

// SignalR realtime for the in-app notification feed. Replaces the 30s polling in useUnreadCount.
//
// Event names MUST match BE (SignalRNotificationNotifier):
//   - "NotificationCreated"  → InAppChannel, when a new in-app notification is written
//   - "NotificationReceived" → SignalRPushChannel, push channel (adds isCritical)
//   - "UnreadCountChanged"   → payload is a RAW INTEGER, not wrapped in an object
//
// This hook should mount only ONCE app-wide (NotificationBell in the layout) — each
// mount opens its own WebSocket; mounting in multiple places doubles connections and events.
export function useNotificationsRealtime(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // New notification: the list/inbox is paginated + filtered by params, so it can't be
    // patched by hand → invalidate so BE returns the correct list.
    //
    // EXCLUDE unread-count: the badge already gets the exact number from "UnreadCountChanged".
    // Invalidating that branch too would mean every new notification triggers an unread-count
    // request — exactly what dropping the polling was meant to avoid. The predicate filters
    // by key[1] so it covers list, infinite, and detail.
    const invalidateFeed = () => {
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === KEY.notifications &&
          q.queryKey[1] !== "unread-count",
      });
    };

    // The hub client is loaded on demand (see shared/lib/signalr.ts), so the connection is
    // created asynchronously. `conn` is filled in once that module has arrived; cleanup waits
    // on `ready`, so it can never run before the connection object exists.
    //
    // Keeping cleanup behind this promise also preserves the original invariant: never call
    // stop() while start() is still pending, or SignalR throws "Failed to start the
    // HttpConnection before stop() was called" (seen with StrictMode's double mount).
    let conn: HubConnection | null = null;

    const ready = createNotificationConnection()
      .then((c) => {
        conn = c;
        c.on("NotificationCreated", invalidateFeed);
        c.on("NotificationReceived", invalidateFeed);

        // Badge: BE sends the unread count directly → write it to the cache, do NOT refetch.
        // This is exactly the request that the old 30s polling used to fire repeatedly.
        c.on("UnreadCountChanged", (unreadCount: number) => {
          if (typeof unreadCount !== "number") return;
          qc.setQueryData(QUERY_KEY.notifications.unreadCount(), unreadCount);
        });

        // Reconnected after a drop → events may have been missed while offline. Here we DO
        // invalidate unread-count too (unlike the handlers above): the badge could genuinely be
        // stale, since an "UnreadCountChanged" event fired during the outage is not resent.
        c.onreconnected(() => {
          qc.invalidateQueries({ queryKey: [KEY.notifications] });
        });

        return c.start();
      })
      .catch(() => {
        // Realtime unavailable → fail silently. REST still serves enough data
        // (BE also treats realtime as an acceleration layer, not a data source).
      });

    return () => {
      void ready.finally(() => {
        const c = conn;
        if (!c) return;
        // Remove handlers BEFORE stopping — guards against a stray event firing into a connection mid-teardown.
        c.off("NotificationCreated");
        c.off("NotificationReceived");
        c.off("UnreadCountChanged");
        if (isLive(c)) c.stop().catch(() => {});
      });
    };
  }, [qc, enabled]);
}
