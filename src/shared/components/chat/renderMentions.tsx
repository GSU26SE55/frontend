import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Captures the "@Name" token in sent text. The first word after "@" always belongs to
// the name; SUBSEQUENT words are only merged in if they start with an UPPERCASE letter
// (proper names, e.g. "Tri Tran", "Staff Tier3 Senior"). This way "@Tri Tran con cc" only
// highlights "@Tri Tran" — the lowercase "con cc" is excluded. The FE doesn't have an
// exact name list in the body (the BE doesn't return mentions alongside the comment),
// so this is the most reliable heuristic available.
const MENTION_RE = /@[\p{L}\p{N}_]+(?: \p{Lu}[\p{L}\p{N}_]*){0,4}/gu;

/**
 * Renders the comment body, coloring the "@Name" part differently from the rest of the text.
 *
 * `isOwn` = your own message (bubble with primary background) → use a light color to stand
 * out against the dark background; otherwise use the primary color on a muted background.
 */
export function renderTextWithMentions(text: string, isOwn = false): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={lastIndex}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    parts.push(
      <span
        key={match.index}
        className={cn(
          "font-semibold",
          isOwn ? "text-amber-200" : "text-amber-600 dark:text-amber-400",
        )}
      >
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={lastIndex}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts;
}
