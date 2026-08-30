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
 *
 * Returns `isLoading` alongside the code because "not loaded yet" and "cannot be read" need
 * DIFFERENT fallbacks. Collapsing them into a bare `code ?? shortId(id)` made every dialog
 * paint a truncated GUID for one frame and then swap it for the real TKT- code — a visible
 * flicker that read as a bug. While loading the caller shows a placeholder; only a settled
 * query with no code falls back to the id.
 */
export const useTicketCode = (ticketId?: string | null) => {
  const { data, isPending, isFetching } = useQuery({
    queryKey: QUERY_KEY.tickets.detail(ticketId ?? ""),
    queryFn: async () => {
      const res = await ticketLookupService.getDetail(ticketId as string);
      return res.data.data ?? null;
    },
    enabled: !!ticketId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    code: data?.code ?? null,
    // `isPending` stays true for a disabled query, so it alone would report "loading" forever
    // when there is no ticket id at all. Gate it on the id, and treat the in-flight first
    // fetch as loading too.
    isLoading: !!ticketId && (isPending || isFetching) && !data,
  };
};

/**
 * The ticket raised for an environmental incident — id and code together.
 *
 * A battery alert carries `ticketId` in its own payload, so the alert dialog can link straight
 * out. An environmental incident carries nothing: the link lives on the ticket side only, which
 * is why its dialog showed no ticket at all while the battery one did. This closes that gap by
 * asking TicketService for the ticket that names this incident.
 *
 * Absence is normal, not an error — the consumer that creates the ticket may not have run yet.
 */
export const useIncidentTicket = (incidentId?: string | null) => {
  const { data, isPending, isFetching } = useQuery({
    queryKey: QUERY_KEY.tickets.byIncident(incidentId ?? ""),
    queryFn: async () => {
      const res = await ticketLookupService.getByIncident(incidentId as string);
      return res.data.data ?? null;
    },
    enabled: !!incidentId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    ticket: data ?? null,
    isLoading: !!incidentId && (isPending || isFetching) && !data,
  };
};
