import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatReaderDto } from "@/shared/types/chat/chat.types";

/** Avatars shown inline; anything beyond this collapses into a "+N" chip. */
const MAX_VISIBLE = 3;

/**
 * BE falls back to the raw userId when the account isn't in its synced read-model
 * (CustomerAccounts/StaffAccounts) — a real case in dev, and after an account is deleted.
 * Showing a UUID to the user is worse than showing nothing, so detect it and say "Unknown".
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUnresolved(reader: ChatReaderDto) {
  const n = reader.displayName?.trim();
  return !n || n === reader.userId || UUID_RE.test(n);
}

function labelFor(reader: ChatReaderDto) {
  return isUnresolved(reader) ? "Unknown user" : reader.displayName.trim();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

interface Props {
  readers: ChatReaderDto[];
}

/**
 * Messenger-style "seen by" row under a message you sent.
 *
 * Only rendered for your OWN messages — the BE only populates `readReceipts` there, since a
 * reader list on someone else's bubble is noise nobody asked for.
 *
 * Deliberately tiny (14px) and unlabelled: it sits under every one of your messages, so any
 * more visual weight would compete with the message itself. The names live in the tooltip.
 */
export default function ChatSeenAvatars({ readers }: Props) {
  if (!readers.length) return null;

  // Newest read first, so the most recent reader is the one that stays visible when the list
  // is truncated. Sorted on a copy — the array comes from the query cache.
  const sorted = [...readers].sort(
    (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime(),
  );
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - visible.length;

  // Names only — the exact read time is noise here; the message's own timestamp already
  // gives the reader everything they need.
  const label = sorted.map(labelFor).join("\n");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="mt-1 flex items-center gap-1 px-1 cursor-default"
            aria-label={`Seen by ${sorted.length} ${
              sorted.length === 1 ? "person" : "people"
            }`}
          />
        }
      >
        <div className="flex -space-x-1">
          {visible.map((r) => (
            <Avatar
              key={r.userId}
              className="size-3.5 ring-1 ring-background"
              // Not focusable/interactive: the whole row shares one tooltip.
              aria-hidden
            >
              {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[7px] leading-none">
                {isUnresolved(r) ? "?" : initials(r.displayName)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {overflow > 0 && (
          <span className="text-3xs text-muted-foreground tabular-nums">
            +{overflow}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="whitespace-pre-line">{label}</TooltipContent>
    </Tooltip>
  );
}
