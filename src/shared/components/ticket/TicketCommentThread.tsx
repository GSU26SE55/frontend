import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  EllipsisVertical,
  Globe,
  Loader2,
  Lock,
  Pin,
  PinOff,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ChatSeenAvatars from "@/shared/components/ticket/ChatSeenAvatars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import VoiceMessagePlayer from "@/shared/components/media/VoiceMessagePlayer";
import ChatAiPanel from "@/shared/components/chat/ChatAiPanel";
import ChatReactionBar from "@/shared/components/chat/ChatReactionBar";
import { renderTextWithMentions } from "@/shared/components/chat/renderMentions";
import {
  isFileId,
  useAudioAttachment,
} from "@/shared/hooks/file/useAudioAttachment";
import {
  ActorRoleEnum,
  VoiceTranscriptionStatusEnum,
  type TicketCommentDTO,
} from "@/shared/types/ticket/ticket.types";
import { useRetryVoiceChat } from "@/shared/hooks/ticket/useTicketChatActions";
import type { OutboxMessage } from "@/shared/types/chat/chat.types";
import { ACTIONS } from "@/shared/constants/actions";
import {
  usePinChat,
  useUnpinChat,
} from "@/features/admin/hooks/ticket/useTicketChats";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { checkPermission, P } from "@/shared/lib/authz";
import type { PinNotice } from "@/shared/hooks/ticket/useTicketCommentsRealtime";
import PinnedMessageBar from "@/shared/components/chat/PinnedMessageBar";
import PinnedMessagesDialog from "@/shared/components/chat/PinnedMessagesDialog";

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
  System: "System",
};

// Mirror BE ChatOptions.EditWindowMinutes (15) — used for UI hinting only, the BE is
// always the final source of truth.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

const LANGUAGE_OPTIONS = [
  { code: "vi", label: "Vietnamese" },
  { code: "en", label: "English" },
] as const;
const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.code, l.label]),
);

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Label for the date separator. Mirrors the mobile thread (Today / Yesterday / dd/MM/yyyy) so
 * the two clients read the same — the separator is the only place the date is shown now that
 * the per-message date line is gone.
 */
function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(d)) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return format(d, "dd/MM/yyyy", { locale: enUS });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

interface CommentBubbleContentProps {
  comment: TicketCommentDTO;
  /** Computed body (original or translated) — used as the bubble/transcript content. */
  displayBody: string;
  isOwn: boolean;
  canShowActions: boolean;
  actionsMenu: React.ReactNode;
  /** GH-133 C3 — enables the attachment download button (chat-attachment endpoint) when ticketId is present. */
  ticketId?: string;
}

/**
 * Content of 1 comment (view mode, not editing): decides whether to render a voice message
 * (Zalo-style) or a normal text bubble + attached images.
 *
 * Voice message (BE creates via /chats/voice): body = transcript + exactly 1 attachment that's
 * an audio file. The hook queries metadata to confirm the audio contentType; it also filters
 * out fileIds that aren't GUIDs (stale/legacy URLs) — the cause of 404s when building
 * /api/files/{fullUrl}/download.
 */
function CommentBubbleContent({
  comment,
  displayBody,
  isOwn,
  canShowActions,
  actionsMenu,
  ticketId,
}: CommentBubbleContentProps) {
  const fileIds = (comment.attachmentFileIds ?? []).filter(isFileId);
  const hasBody = !!comment.body?.trim();
  const voiceStatus = comment.voiceTranscriptionStatus ?? null;
  // Voice chat: the BE attaches voiceTranscriptionStatus. Previously (synchronous transcribe)
  // it only had body + 1 audio attachment so metadata had to be queried; the async flow can
  // have an empty body (Pending/Processing/Failed) — still voice when status is present OR
  // (has body + 1 audio).
  const voiceCandidateId =
    fileIds.length === 1 && (voiceStatus !== null || hasBody)
      ? fileIds[0]
      : undefined;
  const { isAudio } = useAudioAttachment(voiceCandidateId);
  const isVoice = voiceStatus !== null || isAudio === true;

  const { mutate: retryVoice, isPending: retrying } = useRetryVoiceChat();

  if (isVoice && voiceCandidateId) {
    const isPending =
      voiceStatus === VoiceTranscriptionStatusEnum.Pending ||
      voiceStatus === VoiceTranscriptionStatusEnum.Processing;
    const isFailed = voiceStatus === VoiceTranscriptionStatusEnum.Failed;
    const statusHint = isOwn
      ? "text-primary-foreground/85"
      : "text-muted-foreground";

    return (
      <div className="group/bubble flex items-center gap-1">
        {isOwn && canShowActions && actionsMenu}
        <div
          className={cn(
            "rounded-2xl px-3 py-2",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          <VoiceMessagePlayer
            fileId={voiceCandidateId}
            transcript={displayBody}
            isOwn={isOwn}
          />
          {isPending && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 text-2xs",
                statusHint,
              )}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Transcribing voice to text…
            </p>
          )}
          {isFailed && (
            <div
              className={cn(
                "mt-1.5 flex items-center gap-2 text-2xs",
                statusHint,
              )}
            >
              <span>Couldn't transcribe voice to text.</span>
              {ticketId && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={() => retryVoice({ ticketId, chatId: comment.id })}
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                >
                  {retrying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCw className="h-3 w-3" />
                  )}
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
        {!isOwn && canShowActions && actionsMenu}
      </div>
    );
  }

  return (
    <>
      <div className="group/bubble flex items-center gap-1">
        {isOwn && canShowActions && actionsMenu}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-base whitespace-pre-wrap break-words",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          {renderTextWithMentions(displayBody, isOwn)}
        </div>
        {!isOwn && canShowActions && actionsMenu}
      </div>

      {fileIds.length > 0 && (
        <div className="mt-1.5">
          <TicketAttachments
            fileIds={fileIds}
            label={null}
            compact
            ticketId={ticketId}
            chatId={comment.id}
          />
        </div>
      )}
    </>
  );
}

export type ChatTab = "public" | "internal";

interface TicketCommentThreadProps {
  comments: TicketCommentDTO[];
  currentUserId?: string | null;
  /** Controlled tab — if passed, new comments send under this tab (page controls it). */
  activeTab?: ChatTab;
  onTabChange?: (tab: ChatTab) => void;
  /** Ticket is Closed — locks all edit/delete (BE enforces the same) */
  ticketClosed?: boolean;
  /** GH-133 C2 — ticketId to call the AI endpoint (required if aiEnabled is on) */
  ticketId?: string;
  /** GH-133 C2 — shows the AI bar (suggest/summarize). Page gates the role itself. */
  aiEnabled?: boolean;
  /** When an AI suggestion is picked, the page can push the content down into its own composer per role. */
  onSelectSuggestion?: (text: string) => void;
  onEdit?: (chat: TicketCommentDTO, body: string) => void;
  onDelete?: (chat: TicketCommentDTO) => void;
  editPending?: boolean;
  deletePending?: boolean;
  /** Housekeeping — reports the currently displayed chats as read (no unread badge to wire up) */
  /**
   * Marks chats as read. `onFailed` is invoked only if the request fails — the thread uses it
   * to put those ids back in line, so a dropped receipt gets retried on the next render
   * instead of being written off for the session.
   */
  onMarkRead?: (chatIds: string[], onFailed: () => void) => void;
  /** Every role can translate (BE doesn't restrict this) — passing this prop shows the translate menu */
  onTranslate?: (
    chat: TicketCommentDTO,
    targetLanguage: string,
  ) => Promise<{ translatedBody: string; targetLanguage: string } | undefined>;
  /** GH-133 C4 — Admin override edit/delete chat when the ticket is Closed (only Admin passes both). */
  onOverrideEdit?: (chat: TicketCommentDTO) => void;
  onOverrideDelete?: (chat: TicketCommentDTO) => void;
  /** Messages waiting to send (outbox) — renders an optimistic bubble at the end of the stream, filtered by tab. */
  pendingMessages?: OutboxMessage[];
  /** Clicking the red "Retry" line under a failed message → resends that exact message. */
  onRetryPending?: (tempId: string) => void;
  /** Discards a failed message from the queue entirely. */
  onDiscardPending?: (tempId: string) => void;
  /**
   * Live "X pinned a message" notices from the realtime hook, appended at the end of the
   * thread. Session-only: the BE keeps no feed of them, so they are not replayed on reload.
   */
  pinNotices?: PinNotice[];
}

/** Bubble-style chat frame — SPLIT into 2 tabs: Public (customer-visible) & Internal (staff-only). */
export function TicketCommentThread({
  comments,
  currentUserId,
  activeTab,
  onTabChange,
  ticketClosed = false,
  ticketId,
  aiEnabled = false,
  onSelectSuggestion,
  onEdit,
  onDelete,
  editPending = false,
  deletePending = false,
  onMarkRead,
  onTranslate,
  onOverrideEdit,
  onOverrideDelete,
  pendingMessages = [],
  pinNotices = [],
  onRetryPending,
  onDiscardPending,
}: TicketCommentThreadProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>("public");
  const tab = activeTab ?? internalTab;

  // Pin/unpin. Gated on chat.pin, which is exactly what the BE checks
  // (ChatAuthorizationService.CanPinChat) — matching it here rather than guessing from the
  // role avoids the 403-on-click problem described above canEditThis.
  const currentUser = useSessionStore((st) => st.user);
  const canPin = checkPermission(currentUser, P.CHAT_PIN);
  const { mutate: pinChat, isPending: pinPending } = usePinChat();
  const { mutate: unpinChat, isPending: unpinPending } = useUnpinChat();
  const pinBusy = pinPending || unpinPending;
  const [pinnedListOpen, setPinnedListOpen] = useState(false);

  const togglePin = (comment: TicketCommentDTO) => {
    if (!ticketId) return;
    const args = { ticketId, chatId: comment.id };
    if (comment.isPinned) unpinChat(args);
    else pinChat(args);
  };

  // Scrolls the thread to a pinned message and flashes it, so the reader can see WHICH row
  // the bar was pointing at — landing silently on a wall of text says nothing.
  const jumpToMessage = (chatId: string) => {
    setPinnedListOpen(false);
    const el = document.querySelector<HTMLElement>(
      `[data-chat-id="${chatId}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "rounded-lg");
    setTimeout(
      () => el.classList.remove("ring-2", "ring-primary", "rounded-lg"),
      1600,
    );
  };
  const setTab = (t: ChatTab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  // GH-133 — AI suggestions render as bubbles at the end of the chat stream (chatter's side).
  // Clicking one → fills the input but does NOT clear it (user can switch to another option);
  // only cleared once the user successfully sends a message (their own message count goes up).
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const pickSuggestion = (text: string) => {
    onSelectSuggestion?.(text);
  };

  // Oldest on top, newest at the bottom — standard chat UI convention.
  const sorted = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  const visible = useMemo(
    () =>
      sorted.filter((c) => (tab === "internal" ? c.isInternal : !c.isInternal)),
    [sorted, tab],
  );

  // Scoped to the current tab: an internal pin must not surface on the public one, which is
  // customer-visible. Newest first so the bar shows the most recent pin.
  const pinnedMessages = useMemo(
    () =>
      visible
        .filter((c) => c.isPinned && !c.isDeleted)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [visible],
  );

  const authorNameOf = (c: TicketCommentDTO) =>
    c.authorDisplayName ?? ROLE_LABEL[c.authorRole] ?? c.authorRole;

  // "Unread messages" marker — locks in the OLDEST unread message's id the first time data
  // arrives, then keeps it for the whole session. onMarkRead below marks messages as read the
  // moment the tab opens ⇒ if recomputed against fresh data, the divider that just appeared
  // would vanish before the user gets to see where "unread" started. Locked via state +
  // "adjust during render" (React's official pattern for state derived from props): only sets
  // when the tab changes or the first time isRead is available, so it doesn't loop forever.
  // `count` is locked in together with the anchor: counting by the divider's POSITION
  // (visible.length - anchorIndex) would count every message that arrives afterwards —
  // including the ones the current user types themselves — so the badge kept growing while
  // the sender was watching their own messages.
  const [unreadAnchor, setUnreadAnchor] = useState<{
    tab: ChatTab;
    ticketId?: string;
    id: string | null;
    count: number;
    /**
     * Set once the backlog this anchor described has been read. The anchor is then kept —
     * rather than reset to null — precisely so it does NOT lock in again: a message arriving
     * while the user watches must be announced by the "New messages" line at the bottom, not
     * by a red "unread" divider re-anchoring itself part-way up the thread.
     */
    cleared?: boolean;
  } | null>(null);

  // Only lock in once the BE has returned isRead for at least 1 message — the realtime
  // ChatAdded event doesn't include this field, locking in too early would give "no marker"
  // even when there really are unread messages.
  // Keyed on ticketId as well as tab: navigating straight from one ticket to another reuses
  // this component instead of remounting it, so a tab-only key left the previous ticket's
  // anchor pinned on a thread it doesn't belong to.
  const anchorMatches =
    unreadAnchor?.tab === tab && unreadAnchor?.ticketId === ticketId;

  if (!anchorMatches && visible.some((c) => c.isRead !== undefined)) {
    const unread = visible.filter((c) => c.isRead === false);
    setUnreadAnchor({
      tab,
      ticketId,
      id: unread[0]?.id ?? null,
      count: unread.length,
    });
  }

  const rawUnreadAnchorId =
    anchorMatches && !unreadAnchor.cleared ? unreadAnchor.id : null;
  const rawUnreadCount =
    anchorMatches && !unreadAnchor.cleared ? unreadAnchor.count : 0;

  // Messages waiting to send (outbox) belonging to the current tab — optimistic bubble at the end of the stream.
  const pendingForTab = useMemo(
    () =>
      pendingMessages.filter((m) =>
        tab === "internal" ? m.payload.isInternal : !m.payload.isInternal,
      ),
    [pendingMessages, tab],
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const jumpedToUnreadRef = useRef(false);
  const isFirstScrollRef = useRef(true);
  // Counts messages the CURRENT USER has put into the thread (sent or still queued in the
  // outbox). The scroll effect compares it against the previous value to tell "the user just
  // sent something" apart from "someone else's message arrived" — only the former should
  // override the one-time jump to the unread divider.
  const lastSentCountRef = useRef(0);
  // Key of the bottom-most row (pending bubble or real message) — see the scroll effect deps.
  const lastRowKey =
    pendingForTab.length > 0
      ? `pending:${pendingForTab[pendingForTab.length - 1].tempId}`
      : (visible[visible.length - 1]?.id ?? null);
  const sentCount =
    pendingForTab.length +
    (currentUserId
      ? visible.filter((c) => c.authorUserId === currentUserId).length
      : 0);

  useEffect(() => {
    jumpedToUnreadRef.current = false;
  }, [tab]);

  // Has the user reached the bottom of the thread at least once this session? Tracked as state
  // rather than checked inline because IntersectionObserver only fires on a CHANGE of
  // intersection: in a thread short enough not to scroll, the bottom is already visible on
  // mount, so it fires exactly once — at a moment when `isRead` is still false — and never
  // again. Recording the fact separately lets the clearing effect below re-evaluate later.
  // Keyed on tab+ticket so switching either resets it without an effect — same
  // "adjust during render" pattern the unread anchor above uses.
  const [bottomSeen, setBottomSeen] = useState<{
    tab: ChatTab;
    ticketId?: string;
  } | null>(null);
  const reachedBottom =
    bottomSeen?.tab === tab && bottomSeen?.ticketId === ticketId;

  useEffect(() => {
    const el = bottomRef.current;
    if (!el || reachedBottom) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setBottomSeen({ tab, ticketId });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reachedBottom, visible.length, tab, ticketId]);

  // Clear the "Unread messages" line once the user has reached the bottom AND the BE confirms
  // nothing is unread any more. The line is pinned on open on purpose — auto mark-read fires
  // immediately, so recomputing it from fresh data would make it vanish before it could be
  // seen. But pinning it for the WHOLE session left it stranded on screen after the backlog had
  // been read, which is what "the unread line won't go away" means.
  //
  // Both conditions matter: reaching the bottom alone isn't enough in a short thread that opens
  // already scrolled down (the user never read the backlog), and `isRead` alone flips within a
  // second of opening.
  // Computed during render instead of in an effect: setState inside an effect triggers a
  // cascading render, and this is pure derivation — the anchor stays in state only so it can
  // be FROZEN on open, and once it has served its purpose it is simply not shown any more.
  // Latch it on the anchor itself instead of deriving "hidden" every render. Deriving it was
  // the bug behind "the unread line reappears in the wrong place": the moment the backlog was
  // read the divider disappeared, `anchorMatches` was still true but the anchor was no longer
  // being shown — so the very next message from the other person made this block re-run and
  // re-anchor the red line onto it, part-way up the thread. Once cleared, the anchor stays
  // cleared for this tab+ticket, and anything arriving afterwards belongs to the "New
  // messages" line at the bottom.
  if (
    anchorMatches &&
    !unreadAnchor.cleared &&
    !!rawUnreadAnchorId &&
    reachedBottom &&
    !visible.some((c) => c.isRead === false)
  ) {
    setUnreadAnchor({ ...unreadAnchor, cleared: true });
  }

  const unreadAnchorId = rawUnreadAnchorId;
  const unreadCount = rawUnreadCount;

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    // Sending always wins: after the user posts a message the view must land on it, even if
    // the unread divider is still on screen and the one-time jump below hasn't run yet.
    const justSent = sentCount !== lastSentCountRef.current;
    lastSentCountRef.current = sentCount;

    // Unread messages remain → scroll to the divider instead of the bottom, so reading starts
    // from the oldest unread message. Done only ONCE per session; later scrolls (new message,
    // image finished loading) still go to the bottom.
    if (!justSent && unreadDividerRef.current && !jumpedToUnreadRef.current) {
      jumpedToUnreadRef.current = true;
      isFirstScrollRef.current = false;
      unreadDividerRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
      return;
    }

    // Find the nearest scrollable ancestor (overflowY is auto/scroll)
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        break;
      }
      parent = parent.parentElement;
    }
    const container = parent || document.documentElement;

    const isFirst = isFirstScrollRef.current;
    isFirstScrollRef.current = false;
    const behavior = isFirst ? "auto" : "smooth";

    const performScroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    };

    // Scroll immediately
    performScroll();

    // Redo after delays to wait for layout / image / audio player to finish rendering
    const t1 = setTimeout(performScroll, 50);
    const t2 = setTimeout(performScroll, 150);
    const t3 = setTimeout(performScroll, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    visible.length,
    tab,
    aiSuggestions.length,
    pendingForTab.length,
    sentCount,
    // Identity of the last row, not just the counts. When the outbox swaps an optimistic
    // bubble for the real message both lengths stay the same, so without this the effect
    // never re-ran and the view was left sitting above the message just sent.
    lastRowKey,
  ]);

  // Mark-read only covers messages from OTHER people. A message the user sent themself is
  // never unread, so sending it here just burns a slot in the BE read-receipt queue
  // (bounded, and a full queue drops receipts silently) and inflates the count it is meant
  // to clear. Messages BE already reports as read are skipped for the same reason.
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!onMarkRead) return;
    const unmarked = visible
      .filter(
        (c) =>
          c.isRead !== true &&
          !!c.authorUserId &&
          c.authorUserId !== currentUserId,
      )
      .map((c) => c.id)
      .filter((id) => !markedRef.current.has(id));
    if (unmarked.length === 0) return;
    // Marked BEFORE the call so a re-render mid-flight doesn't fire the same ids again —
    // callers pass a fresh inline `onMarkRead` every render, so this effect re-runs often
    // and the ref is the only thing keeping it from looping.
    unmarked.forEach((id) => markedRef.current.add(id));
    // Released again if the request fails, so the ids go back in the queue for the next
    // render instead of being written off for the session. BE answers 503 when its
    // read-receipt queue is full — exactly the case worth retrying.
    onMarkRead(unmarked, () =>
      unmarked.forEach((id) => markedRef.current.delete(id)),
    );
  }, [visible, onMarkRead, currentUserId]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<TicketCommentDTO | null>(
    null,
  );

  // "now" comes from state updated on an interval — avoids calling Date.now() (impure)
  // directly during render when computing withinEditWindow for each comment.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isOwnComment = (c: TicketCommentDTO) =>
    !!currentUserId && c.authorUserId === currentUserId;

  // Clear AI suggestions once the user has sent a message (their own message count goes up).
  const ownCount = useMemo(
    () =>
      currentUserId
        ? comments.filter((c) => c.authorUserId === currentUserId).length
        : 0,
    [comments, currentUserId],
  );
  const prevOwnCountRef = useRef(ownCount);
  useEffect(() => {
    if (ownCount > prevOwnCountRef.current && aiSuggestions.length > 0) {
      setAiSuggestions([]);
    }
    prevOwnCountRef.current = ownCount;
  }, [ownCount, aiSuggestions.length]);

  const withinEditWindow = (c: TicketCommentDTO) =>
    now - new Date(c.createdAt).getTime() <= EDIT_WINDOW_MS;

  const startEdit = (c: TicketCommentDTO) => {
    setEditingId(c.id);
    setEditBody(c.body);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };
  const saveEdit = (c: TicketCommentDTO) => {
    onEdit?.(c, editBody.trim());
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete?.(deleteTarget);
    setDeleteTarget(null);
  };

  // Translations kept locally by chatId — allows toggling original/translated without
  // calling the BE again (the BE already caches by (chatId, targetLanguage) at the DB layer).
  const [translations, setTranslations] = useState<
    Record<string, { lang: string; text: string }>
  >({});
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(
    new Set(),
  );
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const handleTranslate = async (c: TicketCommentDTO, lang: string) => {
    if (!onTranslate) return;
    setTranslatingId(c.id);
    try {
      const result = await onTranslate(c, lang);
      if (result) {
        setTranslations((prev) => ({
          ...prev,
          [c.id]: { lang: result.targetLanguage, text: result.translatedBody },
        }));
        setShowOriginalIds((prev) => {
          if (!prev.has(c.id)) return prev;
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      }
    } finally {
      setTranslatingId(null);
    }
  };

  const toggleShowOriginal = (chatId: string) => {
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {/* Public / Internal tab split — sticks to the top on scroll, background covers messages underneath */}
      <div className="sticky -top-6 z-20 ml-[calc(var(--page-pl)*-1)] mr-[calc(var(--page-pr)*-1)] -mt-6 bg-background pl-(--page-pl) pr-(--page-pr) pt-6 flex items-center gap-1 border-b border-border pb-2 shrink-0">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ChatTab)}>
          <TabsList>
            <TabsTrigger value="public">
              <Globe className="size-3.5" />
              Public
            </TabsTrigger>
            <TabsTrigger value="internal">
              <Lock className="size-3.5" />
              Internal
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Closed ticket → no composer to insert a suggestion into, so the AI bar has
            nothing to act on. */}
        {aiEnabled && ticketId && !ticketClosed && (
          <div className="ml-auto">
            <ChatAiPanel ticketId={ticketId} onSuggestions={setAiSuggestions} />
          </div>
        )}
      </div>

      {/* Pinned strip — sticks directly beneath the tab bar, so the pinned note stays in view
          while the conversation scrolls under it. Same negative-gutter trick as the tab strip
          above: bleed to the page edges so the background covers the messages passing behind,
          and a lower z-index so the tab bar stays on top where the two meet.

          top-10 (40px) is where the tab strip ends: it pins at -top-6 (-24) and stands
          pt-6 + h-8 + pb-2 + 1px border = 65 tall, so its bottom edge lands at 41px. */}
      {pinnedMessages.length > 0 && (
        <div className="sticky top-10 z-10 ml-[calc(var(--page-pl)*-1)] mr-[calc(var(--page-pr)*-1)] bg-background pl-(--page-pl) pr-(--page-pr) shrink-0">
          <PinnedMessageBar
            pinned={pinnedMessages}
            authorName={authorNameOf}
            onOpenList={() => setPinnedListOpen(true)}
          />
        </div>
      )}

      {visible.length === 0 &&
      aiSuggestions.length === 0 &&
      pendingForTab.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {tab === "public"
            ? "No public comments yet."
            : "No internal comments yet."}
        </p>
      ) : (
        <div className="space-y-3 pt-2 pr-2">
          {visible.map((c, index) => {
            // Date separator ONLY at a real day boundary — i.e. between two messages sent on
            // different days. Deliberately not shown above the first message: in a thread where
            // everything happened on one day it would be a lone "Today" header separating
            // nothing, which is noise rather than information.
            const showDateSeparator =
              index > 0 &&
              dayKey(c.createdAt) !== dayKey(visible[index - 1].createdAt);

            const isOwn = isOwnComment(c);
            const name =
              c.authorDisplayName ?? ROLE_LABEL[c.authorRole] ?? c.authorRole;
            const authorWindowOk = isOwn && withinEditWindow(c);
            // Only the author can edit/delete their own message — a higher role does NOT
            // override this. Matches the BE's ChatAuthorizationService.CanEditChat/CanDeleteChat
            // exactly: those two functions accept actorPermissions but never read it, they only
            // compare AuthorUserId. Previously the FE gated the button on chat.edit.any/
            // chat.delete.any ⇒ Admin clicking it always got a 403.
            const canEditThis = !ticketClosed && authorWindowOk;
            const canDeleteThis = !ticketClosed && isOwn;
            const isEditing = editingId === c.id;
            const translation = translations[c.id];
            const showingOriginal = !translation || showOriginalIds.has(c.id);
            const displayBody = showingOriginal ? c.body : translation.text;
            // C4 — Admin override only when the ticket is Closed and the page passes the handler.
            const canOverride =
              ticketClosed && !!onOverrideEdit && !!onOverrideDelete;
            // A deleted message keeps its row as a "This message has been deleted." tombstone,
            // but every action on it is meaningless — there is no body left to edit, translate
            // or delete again, and the BE rejects all three. Gate the whole menu here rather
            // than each flag, so any action added later is covered too.
            // Pinning needs a ticketId to call with, and a closed ticket is read-only.
            const canPinThis = canPin && !!ticketId && !ticketClosed;
            const canShowActions =
              !c.isDeleted &&
              (canEditThis ||
                canDeleteThis ||
                !!onTranslate ||
                canOverride ||
                canPinThis);

            return (
              <Fragment key={c.id}>
                {showDateSeparator && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-3xs font-medium text-muted-foreground">
                      {formatDateLabel(c.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                {c.id === unreadAnchorId && (
                  <div
                    ref={unreadDividerRef}
                    className="flex items-center gap-2 py-1"
                  >
                    <div className="h-px flex-1 bg-destructive" />
                    <span className="rounded-full bg-destructive px-2.5 py-0.5 text-2xs font-bold text-white">
                      {unreadCount > 1
                        ? `${unreadCount} unread messages`
                        : "Unread message"}
                    </span>
                    <div className="h-px flex-1 bg-destructive" />
                  </div>
                )}
                <div
                  data-chat-id={c.id}
                  className={cn(
                    "flex items-end gap-2 transition-shadow",
                    isOwn && "justify-end",
                  )}
                >
                  {!isOwn && (
                    <Avatar size="sm" className="mb-4">
                      <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[75%] flex-col",
                      isOwn ? "items-end" : "items-start",
                    )}
                  >
                    <div className="flex items-center gap-1.5 px-1 mb-0.5">
                      {!isOwn && (
                        <span className="text-2xs font-medium text-muted-foreground">
                          {name}
                        </span>
                      )}
                      {c.isInternal && (
                        <Badge
                          variant="outline"
                          className="text-3xs h-4 px-1.5 gap-0.5 border-amber-500/40 text-amber-700 dark:text-amber-300"
                        >
                          <Lock className="size-2.5" />
                          Internal
                        </Badge>
                      )}
                      {/* Without a marker on the bubble itself, a pinned message is
                          indistinguishable from any other and the menu is the only way to
                          tell — which defeats the point of pinning it. */}
                      {c.isPinned && (
                        <Badge
                          variant="outline"
                          className="text-3xs h-4 px-1.5 gap-0.5 border-primary/40 text-primary"
                        >
                          <Pin className="size-2.5" />
                          Pinned
                        </Badge>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="w-full min-w-[220px] space-y-1.5">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={2}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={editPending || !editBody.trim()}
                            onClick={() => saveEdit(c)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Wrapped so hovering the bubble still reveals when it was sent — the
                      // date line under each message is gone, and the thread has no date
                      // separators, so this is the only place the time is available now.
                      <Tooltip>
                        <TooltipTrigger render={<div />}>
                          <CommentBubbleContent
                            comment={c}
                            displayBody={displayBody}
                            isOwn={isOwn}
                            canShowActions={canShowActions}
                            ticketId={ticketId}
                            actionsMenu={
                              <CommentActionsMenu
                                canEdit={canEditThis}
                                canDelete={canDeleteThis}
                                canTranslate={!!onTranslate}
                                canOverride={canOverride}
                                canPin={canPinThis}
                                isPinned={!!c.isPinned}
                                pinBusy={pinBusy}
                                onTogglePin={() => togglePin(c)}
                                translating={translatingId === c.id}
                                onEdit={() => startEdit(c)}
                                onDelete={() => setDeleteTarget(c)}
                                onTranslate={(lang) => handleTranslate(c, lang)}
                                onOverrideEdit={() => onOverrideEdit?.(c)}
                                onOverrideDelete={() => onOverrideDelete?.(c)}
                              />
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(
                            new Date(c.createdAt),
                            "EEEE, dd/MM/yyyy HH:mm:ss",
                            { locale: enUS },
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* No reacting to a tombstone either — same reasoning as canShowActions. */}
                    {!isEditing &&
                      !c.isDeleted &&
                      ticketId &&
                      !ticketClosed && (
                        <ChatReactionBar
                          ticketId={ticketId}
                          chatId={c.id}
                          currentUserId={currentUserId}
                          align={isOwn ? "end" : "start"}
                        />
                      )}

                    {translation && (
                      <button
                        type="button"
                        onClick={() => toggleShowOriginal(c.id)}
                        className="text-3xs text-muted-foreground underline underline-offset-2 hover:text-foreground px-1 mt-0.5"
                      >
                        {showingOriginal
                          ? `View translation (${LANGUAGE_LABEL[translation.lang] ?? translation.lang})`
                          : "View original"}
                      </button>
                    )}
                    {/* The date line under every bubble was dropped — it repeated on each
                        message and crowded the thread. The full timestamp still shows on
                        hover, and "edited" stays visible since nothing else marks an edit. */}
                    {!!c.editCount && c.editCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="text-3xs text-muted-foreground px-1 mt-0.5 cursor-default" />
                          }
                        >
                          edited
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(
                            new Date(c.createdAt),
                            "EEEE, dd/MM/yyyy HH:mm:ss",
                            { locale: enUS },
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* "Seen by" avatars, Messenger-style. BE only fills readReceipts for
                        messages YOU sent, so this never renders on someone else's bubble. */}
                    {isOwn && !!c.readReceipts?.length && (
                      <ChatSeenAvatars readers={c.readReceipts} />
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}

          {/* "X pinned a message" — a system line in the flow, the way a chat app announces it.
              Clicking "View all" opens the same list the bar above links to. */}
          {pinNotices.map((n) => (
            <div
              key={n.id}
              className="flex flex-col items-center gap-0.5 py-1 text-2xs text-muted-foreground"
            >
              <span>
                {n.byUserDisplayName}{" "}
                {n.isPinned ? "pinned a message." : "unpinned a message."}
              </span>
              <button
                type="button"
                onClick={() => setPinnedListOpen(true)}
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                View all
              </button>
            </div>
          ))}

          {pendingForTab.map((m) => (
            <PendingBubble
              key={m.tempId}
              message={m}
              onRetry={onRetryPending}
              onDiscard={onDiscardPending}
            />
          ))}

          {aiSuggestions.length > 0 && (
            <div className="flex items-end gap-2 justify-end">
              <div className="flex max-w-[85%] flex-col items-end gap-1.5">
                <span className="flex items-center gap-1 text-2xs font-medium text-muted-foreground px-1">
                  <Sparkles className="size-3" />
                  Reply suggestions (AI) — click to insert into the input
                </span>
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full rounded-2xl rounded-br-md border border-primary/30 bg-primary/5 px-3 py-2 text-right text-base whitespace-pre-wrap break-words transition-colors hover:bg-primary/10 hover:border-primary/50"
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAiSuggestions([])}
                  className="text-2xs text-muted-foreground underline underline-offset-2 hover:text-foreground px-1"
                >
                  Dismiss suggestions
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <PinnedMessagesDialog
        open={pinnedListOpen}
        onOpenChange={setPinnedListOpen}
        pinned={pinnedMessages}
        authorName={authorNameOf}
        onJumpTo={jumpToMessage}
        /* Unpin is only offered to a viewer the BE would accept — same permission as pin. */
        onUnpin={
          canPin && ticketId && !ticketClosed
            ? (c) => {
                if (!pinBusy) togglePin(c);
              }
            : undefined
        }
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              The comment is hidden from the conversation. An Admin can restore
              it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletePending}
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CommentActionsMenu({
  canEdit,
  canDelete,
  canTranslate,
  canOverride,
  canPin,
  isPinned,
  pinBusy,
  translating,
  onEdit,
  onDelete,
  onTranslate,
  onTogglePin,
  onOverrideEdit,
  onOverrideDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  canTranslate: boolean;
  canOverride: boolean;
  canPin: boolean;
  isPinned: boolean;
  pinBusy: boolean;
  translating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTranslate: (lang: string) => void;
  onTogglePin: () => void;
  onOverrideEdit: () => void;
  onOverrideDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            /* Icon-only, and rendered once per message — without a name a screen reader
               announces only "button". Matches the neighbouring React button. */
            aria-label="Message actions"
          />
        }
      >
        <EllipsisVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>{ACTIONS.EDIT}</DropdownMenuItem>
        )}
        {canPin && (
          <DropdownMenuItem disabled={pinBusy} onClick={onTogglePin}>
            {isPinned ? (
              <>
                <PinOff className="size-3.5" /> Unpin
              </>
            ) : (
              <>
                <Pin className="size-3.5" /> Pin
              </>
            )}
          </DropdownMenuItem>
        )}
        {canTranslate && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {translating ? "Translating..." : "Translate to"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {LANGUAGE_OPTIONS.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  disabled={translating}
                  onClick={() => onTranslate(l.code)}
                >
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        )}
        {canOverride && (
          <DropdownMenuItem onClick={onOverrideEdit}>
            Edit (override)
          </DropdownMenuItem>
        )}
        {canOverride && (
          <DropdownMenuItem variant="destructive" onClick={onOverrideDelete}>
            Delete (override)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Bubble for a message waiting to send (outbox) — LOOKS IDENTICAL to one's own bubble
 * (blue, right side). The only difference is the bottom line: status instead of timestamp.
 *  - queued/sending: "Sending…" (gray) — still shown this way during a silent retry.
 *  - failed (timed out): "⚠ Send failed · Tap to retry" (red) — click to resend that message.
 */
function PendingBubble({
  message,
  onRetry,
  onDiscard,
}: {
  message: OutboxMessage;
  onRetry?: (tempId: string) => void;
  onDiscard?: (tempId: string) => void;
}) {
  const failed = message.status === "failed";
  const attachCount = message.payload.attachments?.length ?? 0;
  return (
    <div className="flex items-end gap-2 justify-end">
      <div className="flex max-w-[75%] flex-col items-end">
        <div className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-base whitespace-pre-wrap wrap-break-word text-primary-foreground">
          {renderTextWithMentions(message.payload.body, true)}
        </div>
        {attachCount > 0 && (
          <span className="text-3xs text-muted-foreground px-1 mt-0.5">
            {attachCount} attachments
          </span>
        )}
        {failed ? (
          <span className="flex items-center gap-1.5 px-1 mt-0.5">
            {/* Has failReason = the BE rejected it due to content (e.g. duplicate message) →
                resending would fail too, so state the reason instead of prompting a pointless retry. */}
            {message.failReason ? (
              <span className="text-3xs text-destructive">
                ⚠ {message.failReason}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onRetry?.(message.tempId)}
                className="text-3xs text-destructive hover:underline"
              >
                ⚠ Send failed · Tap to retry
              </button>
            )}
            <button
              type="button"
              onClick={() => onDiscard?.(message.tempId)}
              className="text-3xs text-muted-foreground hover:underline"
            >
              Discard
            </button>
          </span>
        ) : (
          <span className="text-3xs text-muted-foreground px-1 mt-0.5">
            Sending…
          </span>
        )}
      </div>
    </div>
  );
}
