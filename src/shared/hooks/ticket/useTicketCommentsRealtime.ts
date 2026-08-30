import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import type { ChatReaderDto } from "@/shared/types/chat/chat.types";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";
import {
  createTicketCommentConnection,
  isConnected,
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
/** ChatRead payload — BE sends it only to the AUTHOR of the messages that were read. */
export interface PinNotice {
  id: string;
  chatId: string;
  isPinned: boolean;
  byUserDisplayName: string;
}

interface ChatReadPayload {
  ticketId: string;
  readers?: ChatReaderDto[];
}

/**
 * Apply `fn` to every chat inside a cached QUERY_KEY.tickets.chats entry.
 *
 * The same key is cached in DIFFERENT shapes depending on which feature fetched it — staff
 * stores a bare TicketCommentDTO[], admin/manager store the raw axios/CommonResponse envelope
 * and unwrap via `select`. Rather than guessing, walk the known containers and return the
 * value untouched whenever the shape isn't recognised, so an unknown shape is left alone
 * instead of being clobbered.
 */
function patchChats(
  cached: unknown,
  fn: (c: TicketCommentDTO) => TicketCommentDTO,
): unknown {
  if (!cached) return cached;

  if (Array.isArray(cached)) return cached.map(fn);

  if (typeof cached !== "object") return cached;

  const obj = cached as Record<string, unknown>;
  for (const key of ["items", "data"]) {
    const inner = obj[key];
    if (inner === undefined) continue;
    const patched = patchChats(inner, fn);
    if (patched !== inner) return { ...obj, [key]: patched };
  }
  return cached;
}

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
  // Pin/unpin announcements for the current session only — "X pinned a message", the line a
  // chat app drops into the conversation. Deliberately not persisted: the BE has no feed of
  // these, and replaying them on every reload would bury the thread in old notices.
  const [pinNotices, setPinNotices] = useState<PinNotice[]>([]);

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

    // BE broadcasts to the whole ticket group, sender included, so a message the user just
    // sent arrives back here too. Refetching the unread count for it makes the badge blink up
    // and then drop again — only messages from OTHER people can change that count.
    // The store is read imperatively: putting accountId in the effect deps would rebuild the
    // SignalR connection every time the session object changes identity.
    const onChatAdded = (dto?: { authorUserId?: string | null }) => {
      const myAccountId = useSessionStore.getState().user?.accountId;
      const isMine = !!dto?.authorUserId && dto.authorUserId === myAccountId;
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
      if (!isMine) {
        qc.invalidateQueries({
          queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
        });
      }
      for (const key of extraKeysRef.current) {
        qc.invalidateQueries({ queryKey: key });
      }
    };

    // The hub client is loaded on demand (see shared/lib/signalr.ts), so the connection is
    // created asynchronously. Cleanup waits on `ready`, which also preserves the original
    // invariant: never call stop() while start() is still pending, or SignalR throws
    // "Failed to start the HttpConnection before stop() was called" (StrictMode double mount).
    let conn: HubConnection | null = null;

    const ready = createTicketCommentConnection()
      .then((c) => {
        // A fast unmount can settle this after cleanup has already run — don't connect then.
        if (cancelled) return;
        conn = c;
        connRef.current = c;

        c.on("ChatAdded", onChatAdded);
        c.on("ChatEdited", invalidateChatList);
        c.on("ChatDeleted", invalidateChatList);

        // ReactionChanged payload: { chatId, reactions } — BE sends the full aggregate along with it.
        // Write straight into the cache (no refetch) → other clients update instantly, zero extra requests.
        c.on(
          "ReactionChanged",
          (payload: { chatId: string; reactions?: unknown }) => {
            if (!payload?.chatId) return;
            const key = QUERY_KEY.tickets.chatReactions(
              ticketId,
              payload.chatId,
            );
            if (payload.reactions) {
              qc.setQueryData(key, payload.reactions);
            } else {
              qc.invalidateQueries({ queryKey: key });
            }
          },
        );

        // "Seen" receipts (Messenger-style). BE sends this ONLY to the author of the messages
        // that were just read, and the payload carries just the NEW receipts from that flush —
        // not the full list. So merge into the cached chats by (chatId, userId) instead of
        // refetching: a refetch here would be one extra request per reader per flush.
        c.on("ChatRead", (payload: ChatReadPayload) => {
          const readers = payload?.readers;
          if (!readers?.length) return;

          const byChat = new Map<string, ChatReaderDto[]>();
          for (const r of readers) {
            if (!r?.chatId) continue;
            const list = byChat.get(r.chatId);
            if (list) list.push(r);
            else byChat.set(r.chatId, [r]);
          }
          if (byChat.size === 0) return;

          const mergeInto = (c: TicketCommentDTO): TicketCommentDTO => {
            const incoming = byChat.get(c.id);
            if (!incoming) return c;
            const merged = [...(c.readReceipts ?? [])];
            for (const r of incoming) {
              const at = merged.findIndex((m) => m.userId === r.userId);
              if (at >= 0) merged[at] = r;
              else merged.push(r);
            }
            return { ...c, readReceipts: merged, readCount: merged.length };
          };

          // The chat list is paginated, so patch every cached page of this ticket.
          qc.setQueriesData(
            { queryKey: QUERY_KEY.tickets.chats(ticketId) },
            (old: unknown) => patchChats(old, mergeInto),
          );
        });

        // Pin state belongs to the whole ticket (it drives the pinned bar above the thread), so
        // everyone viewing it must see a pin/unpin without reloading. The payload carries the
        // new state, so patch the cached pages directly instead of refetching the list.
        c.on(
          "ChatPinChanged",
          (payload: {
            chatId: string;
            isPinned: boolean;
            byUserDisplayName?: string;
          }) => {
            if (!payload?.chatId) return;
            setPinNotices((prev) => [
              ...prev,
              {
                id: `${payload.chatId}-${Date.now()}`,
                chatId: payload.chatId,
                isPinned: payload.isPinned,
                byUserDisplayName: payload.byUserDisplayName ?? "Someone",
              },
            ]);
            qc.setQueriesData(
              { queryKey: QUERY_KEY.tickets.chats(ticketId) },
              (old: unknown) =>
                patchChats(old, (c) =>
                  c.id === payload.chatId
                    ? { ...c, isPinned: payload.isPinned }
                    : c,
                ),
            );
          },
        );

        c.on(
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

        return c.start().then(() => {
          if (!cancelled) return c.invoke("JoinTicket", ticketId);
        });
      })
      .catch(() => {
        // realtime unavailable → ignore, the query still works normally
      });

    return () => {
      cancelled = true;
      Object.values(timers).forEach(clearTimeout);
      // WAIT for start() to finish before leave + stop — avoids stop-before-start.
      void ready.finally(() => {
        const c = conn;
        if (!c) return;
        // Remove handlers BEFORE stopping — guards against a stray event firing into a connection
        // mid-teardown (StrictMode double mount / rebuild) causing a duplicate invalidate.
        c.off("ChatAdded");
        c.off("ChatPinChanged");
        c.off("ChatEdited");
        c.off("ChatDeleted");
        c.off("ReactionChanged");
        c.off("UserTyping");
        if (isConnected(c)) {
          c.invoke("LeaveTicket", ticketId)
            .catch(() => {})
            .finally(() => {
              c.stop().catch(() => {});
            });
        } else {
          c.stop().catch(() => {});
        }
      });
      connRef.current = null;
    };
    // Only rebuild the connection on ticketId — extraInvalidateKeys is read via ref.
  }, [ticketId, qc]);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    // Null while the hub module is still downloading — the typing ping is dropped, the same
    // no-op that already happened whenever the connection was merely "Connecting".
    if (conn && isConnected(conn)) {
      conn.invoke("Typing", ticketId).catch(() => {});
    }
  }, [ticketId]);

  return { typingNames, sendTyping, pinNotices };
}
