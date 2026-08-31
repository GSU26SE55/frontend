/**
 * Default number of rows a paginated list requests on first render.
 * Keep in sync with PAGE_SIZE_OPTIONS in DataPagination — the default must be
 * one of the selectable options, otherwise the size dropdown renders blank.
 */
export const DEFAULT_PAGE_SIZE = 10;

/** Sizes offered by the page-size dropdown. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Messages fetched per request for a ticket chat thread.
 *
 * The thread is rendered as one continuous conversation with no pager and no infinite scroll,
 * so whatever a single request returns is all the user will ever see. The BE default of 10 (and
 * manager's hard-coded 50) silently truncated busy tickets — the thread simply ended early, with
 * nothing to indicate messages were missing while notifications kept arriving for them.
 *
 * 200 covers any realistic ticket. Past that the thread needs real pagination — the BE already
 * exposes GET /chats/cursor for it, which mobile uses.
 */
export const CHAT_PAGE_SIZE = 200;
