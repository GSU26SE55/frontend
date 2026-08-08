// Templated empty/error text — helper functions that take the resource name.
// Kept together so every list/table uses the same wording.
// Usage: <ErrorState message={loadFailed("articles")} /> · <EmptyState title={noData("sites")} />

/** "Couldn't load {resource}." — used by ErrorState when a query fails. */
export const loadFailed = (resource: string) => `Couldn't load ${resource}.`;

/** "No {resource} yet." — used by EmptyState when the list is empty. */
export const noData = (resource: string) => `No ${resource} yet.`;

/** "No matching {resource}." — used when a filter/search returns nothing. */
export const notFound = (resource: string) => `No matching ${resource}.`;

/** Default wording when the resource isn't known. */
export const LOAD_FAILED_DEFAULT = "Couldn't load data. Please try again.";
export const NO_DATA_DEFAULT = "No data yet.";
