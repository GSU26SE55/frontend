import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import {
  createTicketCommentConnection,
  HubConnectionState,
  type HubConnection,
} from "@/shared/lib/signalr";

// SignalR realtime for the comment panel: joins the ticket room, receives ChatAdded
// (invalidates the comment query) + UserTyping. Connection errors are swallowed → UI doesn't
// crash, the query still works (only realtime push is lost).
//
// extraInvalidateKeys: ADDITIONAL query keys to invalidate on ChatAdded.
// Manager renders comments from QUERY_KEY.tickets.chats (default), but staff/admin render
// comments EMBEDDED in the ticket detail (a different key) → pass the corresponding detail key
// so new comments show up realtime without a reload.
export function useTicketCommentsRealtime(
  ticketId: string,
  extraInvalidateKeys: readonly (readonly unknown[])[] = [],
) {
  const qc = useQueryClient();
  const connRef = useRef<HubConnection | null>(null);
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const [typingNames, setTypingNames] = useState<string[]>([]);

  // extraInvalidateKeys is kept in a ref — the caller passes a NEW inline array every render.
  // If it were in the deps, the connection would rebuild constantly → teardown races → duplicate
  // events received. The ref lets the handler read the latest keys WITHOUT recreating the connection.
  // Updated in an effect (not during render) to avoid violating react-hooks/refs.
  const extraKeysRef = useRef(extraInvalidateKeys);
  useEffect(() => {
    extraKeysRef.current = extraInvalidateKeys;
  });

  useEffect(() => {
    if (!ticketId) return;
    const conn = createTicketCommentConnection();
    connRef.current = conn;
    let cancelled = false;
    const timers = typingTimers.current;

    // Event names MUST match BE (SignalRTicketChatNotifier): "ChatAdded"/"ChatEdited"/
    // "ChatDeleted"/"ReactionChanged" — NOT "CommentAdded".
    const invalidateChatList = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
      // The "unread" badge on the Comments tab must jump immediately on a new message /
      // deleted message — in step with the list, no waiting for the user to reload.
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
      for (const key of extraKeysRef.current) {
        qc.invalidateQueries({ queryKey: key });
      }
    };

    conn.on("ChatAdded", invalidateChatList);
    conn.on("ChatEdited", invalidateChatList);
    conn.on("ChatDeleted", invalidateChatList);

    // ReactionChanged payload: { chatId, reactions } — BE sends the full aggregate along with it.
    // Write straight into the cache (no refetch) → other clients update instantly, zero extra requests.
    conn.on(
      "ReactionChanged",
      (payload: { chatId: string; reactions?: unknown }) => {
        if (!payload?.chatId) return;
        const key = QUERY_KEY.tickets.chatReactions(ticketId, payload.chatId);
        if (payload.reactions) {
          qc.setQueryData(key, payload.reactions);
        } else {
          qc.invalidateQueries({ queryKey: key });
        }
      },
    );

    conn.on(
      "UserTyping",
      (_ticketId: string, userId: string, displayName: string) => {
        setTypingNames((prev) =>
          prev.includes(displayName) ? prev : [...prev, displayName],
        );
        clearTimeout(timers[userId]);
        timers[userId] = setTimeout(() => {
          setTypingNames((prev) => prev.filter((n) => n !== displayName));
        }, 3000);
      },
    );

    // Keep the start() promise so cleanup WAITS for it to settle before calling stop(). Calling
    // stop() while start() is still pending → SignalR throws "Failed to start the HttpConnection
    // before stop() was called" (seen with StrictMode's double mount / fast remounts).
    const startPromise = conn
      .start()
      .then(() => {
        if (!cancelled) return conn.invoke("JoinTicket", ticketId);
      })
      .catch(() => {
        // realtime unavailable → ignore, the query still works normally
      });

    return () => {
      cancelled = true;
      Object.values(timers).forEach(clearTimeout);
      // Remove handlers BEFORE stopping — guards against a stray event firing into a connection
      // mid-teardown (StrictMode double mount / rebuild) causing a duplicate invalidate.
      conn.off("ChatAdded");
      conn.off("ChatEdited");
      conn.off("ChatDeleted");
      conn.off("ReactionChanged");
      conn.off("UserTyping");
      // WAIT for start() to finish before leave + stop — avoids stop-before-start.
      void startPromise.finally(() => {
        if (conn.state === HubConnectionState.Connected) {
          conn
            .invoke("LeaveTicket", ticketId)
            .catch(() => {})
            .finally(() => {
              conn.stop().catch(() => {});
            });
        } else {
          conn.stop().catch(() => {});
        }
      });
      connRef.current = null;
    };
    // Only rebuild the connection on ticketId — extraInvalidateKeys is read via ref.
  }, [ticketId, qc]);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    if (conn && conn.state === HubConnectionState.Connected) {
      conn.invoke("Typing", ticketId).catch(() => {});
    }
  }, [ticketId]);

  return { typingNames, sendTyping };
}
