import { useQuery } from "@tanstack/react-query";
import { ticketLookupService } from "@/shared/services/ticket/ticket-lookup.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Resolves a ticket id into its human-readable code (e.g. "TKT-2608-0001").
 *
 * Alerts carry only `ticketId`; the alert payload has no ticket code to show, so the
 * code has to be read from the ticket itself. Shares `QUERY_KEY.tickets.detail(id)`
 * with the ticket detail pages on purpose — opening an alert whose ticket is already
 * cached costs no request at all.
 *
 * Failure is not surfaced: the code is a nicety on a details dialog, and a user who
 * cannot read this one ticket (403) or a ticket that has since been deleted (404)
 * must not turn into an error state on an otherwise fine alert. Callers fall back to
 * the raw id. `retry: false` keeps that fallback quick instead of retrying a 403.
 */
export const useTicketCode = (ticketId?: string | null) => {
  const { data } = useQuery({
    queryKey: QUERY_KEY.tickets.detail(ticketId ?? ""),
    queryFn: async () => {
      const res = await ticketLookupService.getDetail(ticketId as string);
      return res.data.data ?? null;
    },
    enabled: !!ticketId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return data?.code ?? null;
};
