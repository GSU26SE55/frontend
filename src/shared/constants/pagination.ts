/**
 * Default number of rows a paginated list requests on first render.
 * Keep in sync with PAGE_SIZE_OPTIONS in DataPagination — the default must be
 * one of the selectable options, otherwise the size dropdown renders blank.
 */
export const DEFAULT_PAGE_SIZE = 10;

/** Sizes offered by the page-size dropdown. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50];
