export const KbArticleStatusEnum = {
  Draft: 1,
  Published: 2,
  Archived: 3,
} as const;
export type KbArticleStatusEnum =
  (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];

export const KbArticleStatusLabel: Record<KbArticleStatusEnum, string> = {
  [KbArticleStatusEnum.Draft]: "Nháp",
  [KbArticleStatusEnum.Published]: "Đã xuất bản",
  [KbArticleStatusEnum.Archived]: "Lưu trữ",
};

export const KbReferenceTypeEnum = {
  ConsultedDuringResolve: 1,
  ProvidedToCustomer: 2,
  GeneratedAfterResolve: 3,
} as const;
export type KbReferenceTypeEnum =
  (typeof KbReferenceTypeEnum)[keyof typeof KbReferenceTypeEnum];

export const KbReferenceTypeLabel: Record<KbReferenceTypeEnum, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]: "Tham khảo khi xử lý",
  [KbReferenceTypeEnum.ProvidedToCustomer]: "Cung cấp cho khách",
  [KbReferenceTypeEnum.GeneratedAfterResolve]: "Tạo sau khi xử lý",
};
