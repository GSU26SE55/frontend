// Reaction types for a chat message — mirrors the BE's ReactionTypeEnum
// (TicketService.Domain).
// The BE sends/receives string names (JsonStringEnumConverter) — NOT numbers.
// The aggregate response groups by exactly these 5 keys.
export const ReactionTypeEnum = {
  ThumbsUp: "ThumbsUp",
  Acknowledged: "Acknowledged",
  Resolved: "Resolved",
  NeedMoreInfo: "NeedMoreInfo",
  Disagree: "Disagree",
} as const;
export type ReactionTypeEnum =
  (typeof ReactionTypeEnum)[keyof typeof ReactionTypeEnum];

// Display order in the picker + the reaction row under a bubble.
export const REACTION_ORDER: ReactionTypeEnum[] = [
  ReactionTypeEnum.ThumbsUp,
  ReactionTypeEnum.Acknowledged,
  ReactionTypeEnum.Resolved,
  ReactionTypeEnum.NeedMoreInfo,
  ReactionTypeEnum.Disagree,
];

// Emoji + display label per type — mapped on the FE (the BE only defines the enum).
export const REACTION_META: Record<
  ReactionTypeEnum,
  { emoji: string; label: string }
> = {
  ThumbsUp: { emoji: "👍", label: "Like" },
  Acknowledged: { emoji: "🫡", label: "Acknowledged" },
  Resolved: { emoji: "😀", label: "Resolved" },
  NeedMoreInfo: { emoji: "🤔", label: "Need more information" },
  Disagree: { emoji: "🙄", label: "Disagree" },
};
