import { Pin } from "lucide-react";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";

interface Props {
  /** Newest first — the bar shows [0] and offers the rest through the dialog. */
  pinned: TicketCommentDTO[];
  authorName: (comment: TicketCommentDTO) => string;
  /** Opens the full "Pinned messages" list. */
  onOpenList: () => void;
}

/**
 * The strip above the thread showing the most recently pinned message, the way a chat app
 * keeps one pinned note in view.
 *
 * Only the newest is shown: the bar has one line to spend, and a stack of five would push the
 * conversation itself off screen. The count badge is what tells the reader there are more, and
 * clicking anywhere on the bar opens the full list.
 */
export default function PinnedMessageBar({
  pinned,
  authorName,
  onOpenList,
}: Props) {
  if (pinned.length === 0) return null;
  const latest = pinned[0];

  return (
    <button
      type="button"
      onClick={onOpenList}
      className="w-full text-left flex items-start gap-2 border-b border-border bg-muted/40 px-3 py-2 hover:bg-muted/70 transition-colors"
      aria-label={`${pinned.length} pinned ${pinned.length === 1 ? "message" : "messages"} — open the list`}
    >
      <Pin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-2xs font-medium text-muted-foreground truncate">
            {authorName(latest)}
          </span>
          {pinned.length > 1 && (
            <span className="text-2xs text-muted-foreground shrink-0">
              +{pinned.length - 1} more
            </span>
          )}
        </span>
        {/* One line only, ellipsised: the bar is a pointer to the message, not a copy of it. */}
        <span className="block text-xs truncate">{latest.body}</span>
      </span>
    </button>
  );
}
