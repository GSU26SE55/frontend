import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useTicketChatUnreadCount } from "@/shared/hooks/ticket/useTicketChatActions";
import { DUR, EASE_OUT, SPRING } from "@/shared/motion/tokens";

interface Props {
  ticketId: string;
}

/**
 * Red badge showing the unread chat count on the "Comments" tab (Messenger-style).
 * Hidden when = 0, and also hidden while that same tab is open.
 *
 * Why hide it while the tab is active: an incoming message via SignalR invalidates the unread
 * count BEFORE `TicketCommentThread` gets to mark-read, so the badge flashes to 1 then drops —
 * the user is reading that exact message yet still sees "unread". `group-data-[state=active]`
 * reads the parent TabsTrigger's state directly (Radix), so there's no need to plumb active
 * state down from each page.
 */
export default function ChatUnreadBadge({ ticketId }: Props) {
  const { data: unreadCount = 0 } = useTicketChatUnreadCount(ticketId);
  const reduced = useReducedMotion();
  const label = unreadCount > 99 ? "99+" : String(unreadCount);

  // Keyed on the count so an incoming message re-pops the pill — the number changing
  // under a static badge is easy to miss. Same treatment as NotificationBell.
  return (
    <AnimatePresence initial={false}>
      {unreadCount > 0 && (
        <motion.span
          key={label}
          aria-label={`${unreadCount} unread comments`}
          // min-w = h so a single digit renders as a circle, longer numbers auto-expand into a pill.
          // tabular-nums keeps the width stable as the number changes, avoiding tab jitter.
          className="ml-1.5 h-[15px] min-w-[15px] px-1 inline-flex items-center justify-center rounded-full text-white text-[10px] font-semibold leading-none tabular-nums group-data-[state=active]:hidden"
          style={{ backgroundColor: "var(--p1)" }}
          initial={reduced ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: SPRING }}
          exit={{
            scale: 0.4,
            opacity: 0,
            transition: { duration: DUR.state, ease: EASE_OUT },
          }}
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
