import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";

// KB article status — the BE serializes this enum as a STRING (JsonStringEnumConverter)
export const KbArticleStatusEnum = {
  Draft: "Draft",
  PendingReview: "PendingReview",
  Published: "Published",
  Archived: "Archived",
} as const;
export type KbArticleStatusEnum =
  (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];

export const KbArticleStatusLabel: Record<KbArticleStatusEnum, string> = {
  [KbArticleStatusEnum.Draft]: "Draft",
  [KbArticleStatusEnum.PendingReview]: "Pending approval",
  [KbArticleStatusEnum.Published]: "Published",
  [KbArticleStatusEnum.Archived]: "Archived",
};

// Matching numeric values — used when sending the `?Status=` filter (the BE takes an int)
export const KbArticleStatusCode: Record<KbArticleStatusEnum, number> = {
  [KbArticleStatusEnum.Draft]: 1,
  [KbArticleStatusEnum.PendingReview]: 2,
  [KbArticleStatusEnum.Published]: 3,
  [KbArticleStatusEnum.Archived]: 4,
};

// Version status — the BE serializes this as a STRING (JsonStringEnumConverter,
// since 2026-06-22)
export const KbVersionStatusEnum = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  Archived: "Archived",
} as const;
export type KbVersionStatusEnum =
  (typeof KbVersionStatusEnum)[keyof typeof KbVersionStatusEnum];

export const KbVersionStatusLabel: Record<KbVersionStatusEnum, string> = {
  [KbVersionStatusEnum.Pending]: "Pending approval",
  [KbVersionStatusEnum.Approved]: "Approved",
  [KbVersionStatusEnum.Rejected]: "Rejected",
  [KbVersionStatusEnum.Archived]: "Archived version",
};

// Reference type — the BE serializes this as a STRING
export const KbReferenceTypeEnum = {
  ConsultedDuringResolve: "ConsultedDuringResolve",
  ProvidedToCustomer: "ProvidedToCustomer",
  GeneratedAfterResolve: "GeneratedAfterResolve",
} as const;
export type KbReferenceTypeEnum =
  (typeof KbReferenceTypeEnum)[keyof typeof KbReferenceTypeEnum];

export const KbReferenceTypeLabel: Record<KbReferenceTypeEnum, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]: "Consulted while resolving",
  [KbReferenceTypeEnum.ProvidedToCustomer]: "Provided to the customer",
  [KbReferenceTypeEnum.GeneratedAfterResolve]: "Created after resolving",
};

// ── Category (KB shares TicketCategoryEnum) ──
// Responses return category as a STRING; the `?Category=` filter needs a NUMBER →
// use KbCategoryCode.
export const KbCategoryLabel: Record<TicketCategoryEnum, string> = {
  [TicketCategoryEnum.Charging]: "Charging fault",
  [TicketCategoryEnum.Overheat]: "Overheating",
  [TicketCategoryEnum.NoPower]: "No power",
  [TicketCategoryEnum.Performance]: "Poor performance",
  [TicketCategoryEnum.Other]: "Other",
  [TicketCategoryEnum.Repair]: "Repair request",
};

export const KbCategoryCode: Record<TicketCategoryEnum, number> = {
  [TicketCategoryEnum.Charging]: 1,
  [TicketCategoryEnum.Overheat]: 2,
  [TicketCategoryEnum.NoPower]: 3,
  [TicketCategoryEnum.Performance]: 4,
  [TicketCategoryEnum.Other]: 5,
  [TicketCategoryEnum.Repair]: 6,
};

export const KB_CATEGORY_OPTIONS = (
  Object.values(TicketCategoryEnum) as TicketCategoryEnum[]
).map((c) => ({
  value: c,
  label: KbCategoryLabel[c],
  code: KbCategoryCode[c],
}));
