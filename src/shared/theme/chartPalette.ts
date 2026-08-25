/**
 * Categorical chart colours, for dimensions where no value is worse than another: one
 * colour per person, per category, per pipeline stage.
 *
 * Deliberately separate from `statusColors.ts`. There, red means "this is breaching" and
 * the hue is the message; here the hue only tells slices apart. Mixing the two makes a
 * chart look like it is flagging something when it is just listing.
 *
 * Tokens live in index.css so both themes get their own values.
 */
export const CATEGORY_COLORS = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
] as const;

/** Colour for slice `index`, wrapping once the palette runs out. */
export const categoryColor = (index: number) =>
  CATEGORY_COLORS[index % CATEGORY_COLORS.length];
