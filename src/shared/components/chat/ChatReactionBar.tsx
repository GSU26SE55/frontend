import { useMemo } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAddReaction,
  useChatReactions,
  useRemoveReaction,
} from "@/features/admin/hooks/ticket/useTicketChats";
import {
  REACTION_META,
  REACTION_ORDER,
  ReactionTypeEnum,
} from "@/shared/enums/ticket/reaction.enum";
import type {
  ChatReactionGroupDto,
  ChatReactionsAggregateDto,
} from "@/shared/types/chat/chat.types";

// Map from enum → camelCase key of the aggregate DTO (BE returns camelCase).
const GROUP_KEY: Record<ReactionTypeEnum, keyof ChatReactionsAggregateDto> = {
  ThumbsUp: "thumbsUp",
  Acknowledged: "acknowledged",
  Resolved: "resolved",
  NeedMoreInfo: "needMoreInfo",
  Disagree: "disagree",
};

interface Props {
  ticketId: string;
  chatId: string;
  currentUserId?: string | null;
  /** Right-align for your own messages (isOwn) — matches the bubble layout. */
  align?: "start" | "end";
}

/**
 * Reaction row attached under EACH chat bubble (Zalo/Slack style) — GH-133.
 * - React button: opens a menu of 5 fixed reaction types (mapped from BE ReactionTypeEnum).
 * - Reacted chip: shows emoji + count, click to toggle (add/remove your own reaction).
 * Shared across admin/manager/staff via TicketCommentThread.
 */
export default function ChatReactionBar({
  ticketId,
  chatId,
  currentUserId,
  align = "start",
}: Props) {
  const { data: aggregate } = useChatReactions(ticketId, chatId);
  const addM = useAddReaction();
  const removeM = useRemoveReaction();

  // Reaction types that currently have ≥1 person reacting — with an own-reaction flag.
  const active = useMemo(() => {
    if (!aggregate)
      return [] as { type: ReactionTypeEnum; count: number; mine: boolean }[];
    return REACTION_ORDER.map((type) => {
      const group: ChatReactionGroupDto | undefined =
        aggregate[GROUP_KEY[type]];
      const count = group?.count ?? 0;
      const mine =
        !!currentUserId &&
        !!group?.users?.some((u) => u.userId === currentUserId);
      return { type, count, mine };
    }).filter((r) => r.count > 0);
  }, [aggregate, currentUserId]);

  const pending = addM.isPending || removeM.isPending;

  const toggle = (type: ReactionTypeEnum, mine: boolean) => {
    if (pending) return;
    if (mine) removeM.mutate({ ticketId, chatId, reactionType: type });
    else addM.mutate({ ticketId, chatId, reactionType: type });
  };

  return (
    <div
      className={cn(
        "mt-0.5 flex flex-wrap items-center gap-1 px-1",
        align === "end" && "justify-end",
      )}
    >
      {active.map(({ type, count, mine }) => (
        <Tooltip key={type}>
          <TooltipTrigger
            render={
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(type, mine)}
                className={cn(
                  "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-2xs tabular-nums transition-colors disabled:opacity-60",
                  mine
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              />
            }
          >
            <span className="text-2sm leading-none">
              {REACTION_META[type].emoji}
            </span>
            <span>{count}</span>
          </TooltipTrigger>
          <TooltipContent>{REACTION_META[type].label}</TooltipContent>
        </Tooltip>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={pending}
              className="size-5 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="React"
            />
          }
        >
          <SmilePlus className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="flex w-auto! min-w-0 flex-row gap-0.5 rounded-full p-1"
        >
          {REACTION_ORDER.map((type) => {
            const mine = active.find((r) => r.type === type)?.mine ?? false;
            return (
              <Tooltip key={type}>
                <TooltipTrigger
                  render={
                    <DropdownMenuItem
                      disabled={pending}
                      onClick={() => toggle(type, mine)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full p-0 text-lg leading-none transition-transform hover:scale-125 focus:scale-125",
                        mine && "bg-primary/10",
                      )}
                    />
                  }
                >
                  {REACTION_META[type].emoji}
                </TooltipTrigger>
                <TooltipContent>{REACTION_META[type].label}</TooltipContent>
              </Tooltip>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
