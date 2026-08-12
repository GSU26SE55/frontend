import { useQuery } from "@tanstack/react-query";

import { suggestionService } from "@/shared/services/suggestion/suggestion.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Suggests suitable staff to handle a ticket (Manager/Admin).
 *
 * `staleTime: 0` is intentional: the fit score depends on how many tickets each
 * person is currently handling, which changes every time someone gets assigned.
 * A long cache would make the Manager see someone as "free" when they just got
 * loaded up with work.
 *
 * `enabled` for lazy fetching — only fetch when the panel is actually open, to
 * avoid firing a request for every ticket in the list.
 */
export function useStaffSuggestions(
  ticketId: string | undefined,
  options?: { topN?: number; enabled?: boolean },
) {
  const topN = options?.topN ?? 5;
  return useQuery({
    queryKey: QUERY_KEY.tickets.staffSuggestions(ticketId ?? "", topN),
    queryFn: async () => {
      const res = await suggestionService.staff(ticketId!, topN);
      return res.data.data;
    },
    enabled: Boolean(ticketId) && (options?.enabled ?? true),
    staleTime: 0,
    // The AI can be temporarily unresponsive — the BE already returns 200 with
    // aiAvailable=false, so retrying wouldn't help and would just make the user wait longer.
    retry: false,
  });
}

/**
 * Suggests KB articles to reference while repairing.
 *
 * Permissions: Manager/Admin can see any ticket; Staff must be ASSIGNED
 * (PrimaryHandler or Supporter). Not assigned → BE returns 403, hook returns `error`.
 *
 * `staleTime` is longer than the staffing one: article content doesn't change by the minute.
 */
export function useKbSuggestions(
  ticketId: string | undefined,
  options?: { topN?: number; enabled?: boolean },
) {
  const topN = options?.topN ?? 5;
  return useQuery({
    queryKey: QUERY_KEY.tickets.kbSuggestions(ticketId ?? "", topN),
    queryFn: async () => {
      const res = await suggestionService.kb(ticketId!, topN);
      return res.data.data;
    },
    enabled: Boolean(ticketId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
