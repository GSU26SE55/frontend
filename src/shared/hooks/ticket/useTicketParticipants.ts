import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ticketParticipantService } from "@/shared/services/ticket/ticket-participant.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import type { MentionCandidate } from "@/shared/components/chat/MentionTextarea";

// GET /api/tickets/{ticketId}/participants — active participants of the ticket.
export const useTicketParticipants = (ticketId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.ticketParticipants.list(ticketId ?? ""),
    queryFn: () =>
      ticketParticipantService
        .getParticipants(ticketId as string)
        .then((r) => r.data.data ?? []),
    enabled: !!ticketId,
    staleTime: 60_000,
  });

/**
 * List of people who can be @-tagged in the chat composer.
 *
 * The correct source is the ticket's participants — NOT people who've already chatted: someone
 * newly added to the ticket but who hasn't sent a message yet must still be taggable.
 *
 * Filter: ONLY excludes the current user. Deliberately not filtered by `canPost`/`canViewInternal` —
 * BE (ChatAddCommandHandler) validates a mention solely by "is this an active participant",
 * so a stricter filter here would hide people from the dropdown that BE would still allow to
 * be mentioned. `canPost` is the permission to SEND chat, unrelated to being mentioned
 * (e.g. a Watcher with `canPost=false` still needs to be taggable).
 *
 * Warning — internal note: BE currently does NOT block mentioning someone with
 * `canViewInternal=false` in an internal chat — they'll get a notification for a chat they
 * can't open. The hook returns `canViewInternal` so the UI can warn; don't hide this on the
 * FE side, it would drift from BE's behavior.
 */
export const useMentionCandidates = (ticketId?: string): MentionCandidate[] => {
  const { data } = useTicketParticipants(ticketId);
  const currentUserId = useSessionStore((s) => s.user?.accountId);

  return useMemo(() => {
    if (!data) return [];
    return data
      .filter((p) => p.userId !== currentUserId)
      .map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        role: p.userRole,
        canViewInternal: p.canViewInternal,
      }));
  }, [data, currentUserId]);
};
