// Loại reaction cho chat message — khớp BE ReactionTypeEnum (TicketService.Domain).
// BE gửi/nhận string name (JsonStringEnumConverter) — KHÔNG phải số.
// Response aggregate group theo đúng 5 key này.
export const ReactionTypeEnum = {
  ThumbsUp: "ThumbsUp",
  Acknowledged: "Acknowledged",
  Resolved: "Resolved",
  NeedMoreInfo: "NeedMoreInfo",
  Disagree: "Disagree",
} as const;
export type ReactionTypeEnum =
  (typeof ReactionTypeEnum)[keyof typeof ReactionTypeEnum];

// Thứ tự hiển thị trong picker + hàng reaction dưới bubble.
export const REACTION_ORDER: ReactionTypeEnum[] = [
  ReactionTypeEnum.ThumbsUp,
  ReactionTypeEnum.Acknowledged,
  ReactionTypeEnum.Resolved,
  ReactionTypeEnum.NeedMoreInfo,
  ReactionTypeEnum.Disagree,
];

// Emoji + nhãn tiếng Việt cho từng loại — FE tự map (BE chỉ định nghĩa enum).
export const REACTION_META: Record<
  ReactionTypeEnum,
  { emoji: string; label: string }
> = {
  ThumbsUp: { emoji: "👍", label: "Thích" },
  Acknowledged: { emoji: "🫡", label: "Đã tiếp nhận" },
  Resolved: { emoji: "😀", label: "Đã giải quyết" },
  NeedMoreInfo: { emoji: "🤔", label: "Cần thêm thông tin" },
  Disagree: { emoji: "🙄", label: "Không đồng ý" },
};
