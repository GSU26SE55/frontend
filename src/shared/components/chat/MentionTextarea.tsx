import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MentionInput } from "@/shared/schemas/ticket/ticket-comment.schema";

// People who can be tagged — built from the ticket's active participants (GET .../participants).
export interface MentionCandidate {
  userId: string;
  displayName: string;
  role?: string;
  /** Can view internal chat. false + composing an internal chat → warning in the dropdown. */
  canViewInternal?: boolean;
}

// Regex that captures the @-token currently being typed right before the caret: "@" + name characters (no line breaks, allows a single space between words).
// E.g. "... @Nguyen Va" → group(1) = "Nguyen Va".
const MENTION_TOKEN = /(?:^|\s)@([\p{L}\p{N}_ ]{0,30})$/u;

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

type TextareaProps = ComponentProps<typeof Textarea>;

interface Props extends Omit<TextareaProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  candidates: MentionCandidate[];
  /** Composing an internal chat — enables a warning for people who can't view internal chat. */
  isInternal?: boolean;
  /** Reports the list of tagged people up to the form (to send the `mentions` field). */
  onMentionsChange?: (mentions: MentionInput[]) => void;
  /**
   * Enter = send, Shift+Enter = newline (chat convention). If not passed, Enter
   * inserts a newline like a normal textarea. The form itself decides whether
   * sending is allowed — the callback only reports "the user just pressed Enter".
   */
  onSubmitKey?: () => void;
}

/**
 * Textarea with @-mention: typing "@" → shows a dropdown filtered by name. Picking
 * a person → inserts "@Name " into the text and records {userId, displayName} to
 * send to the BE. The BE receives mentions via the `mentions` field (does NOT parse
 * "@" from the text), so the FE has to collect the picked people separately from the body.
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, Props>(
  function MentionTextarea(
    {
      value,
      onChange,
      candidates,
      isInternal = false,
      onMentionsChange,
      onSubmitKey,
      className,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // People already tagged in the message being composed (deduped by userId).
    const [picked, setPicked] = useState<MentionInput[]>([]);
    // The "@..." token currently being typed; null = dropdown closed.
    const [query, setQuery] = useState<string | null>(null);
    const [highlight, setHighlight] = useState(0);

    const matches =
      query === null
        ? []
        : candidates
            .filter((c) =>
              c.displayName.toLowerCase().includes(query.toLowerCase()),
            )
            .slice(0, 6);

    const open = query !== null && matches.length > 0;

    const syncPicked = (next: MentionInput[]) => {
      setPicked(next);
      onMentionsChange?.(next);
    };

    const handleChange = (text: string) => {
      onChange(text);
      const caret = innerRef.current?.selectionStart ?? text.length;
      const before = text.slice(0, caret);
      const m = before.match(MENTION_TOKEN);
      setQuery(m ? m[1] : null);
      setHighlight(0);

      // If a tagged person's name is removed from the body, drop them from the send list.
      if (picked.length > 0) {
        const stillThere = picked.filter((p) =>
          text.includes(`@${p.displayName}`),
        );
        if (stillThere.length !== picked.length) syncPicked(stillThere);
      }
    };

    const choose = (c: MentionCandidate) => {
      const el = innerRef.current;
      const caret = el?.selectionStart ?? value.length;
      const before = value.slice(0, caret);
      const after = value.slice(caret);
      // Replace the "@query" token being typed with the complete "@Name ".
      const replaced = before.replace(MENTION_TOKEN, (whole, _q, offset) => {
        const lead = whole.startsWith("@") ? "" : whole[0]; // keep the leading whitespace if any
        void offset;
        return `${lead}@${c.displayName} `;
      });
      const next = replaced + after;
      onChange(next);
      setQuery(null);

      if (!picked.some((p) => p.userId === c.userId)) {
        syncPicked([
          ...picked,
          { userId: c.userId, displayName: c.displayName },
        ]);
      }

      requestAnimationFrame(() => {
        el?.focus();
        const pos = replaced.length;
        el?.setSelectionRange(pos, pos);
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open) {
        // Enter = send, Shift/Ctrl/Cmd+Enter = newline.
        // Skip while typing via IME (isComposing): the input method uses Enter to
        // commit the word being composed, blocking it here would send half-typed text.
        if (
          onSubmitKey &&
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.nativeEvent.isComposing
        ) {
          e.preventDefault();
          onSubmitKey();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choose(matches[highlight]);
      } else if (e.key === "Escape") {
        setQuery(null);
      }
    };

    return (
      <div className="relative flex-1">
        {open && (
          <ul
            role="listbox"
            aria-label="People suggestions to tag"
            className="absolute bottom-full z-50 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            {matches.map((c, i) => (
              <li key={c.userId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(c);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    i === highlight
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-3xs">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{c.displayName}</span>
                  {/* The BE doesn't block mentioning someone who can't view internal chat —
                      show a warning so the composer can decide for themselves. */}
                  {isInternal && c.canViewInternal === false && (
                    <span
                      className="shrink-0 text-3xs text-amber-600 dark:text-amber-400"
                      title="This person can't view internal chat"
                    >
                      can't view
                    </span>
                  )}
                  {c.role && (
                    <span className="ml-auto shrink-0 text-3xs text-muted-foreground">
                      {c.role}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Textarea
          ref={(el) => {
            innerRef.current = el;
          }}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={className}
          {...rest}
          // After {...rest}: the component's onKeyDown MUST win, otherwise if the caller
          // happens to pass onKeyDown, both dropdown navigation and Enter-to-send break.
          onKeyDown={(e) => {
            rest.onKeyDown?.(e);
            if (!e.defaultPrevented) handleKeyDown(e);
          }}
        />
      </div>
    );
  },
);
