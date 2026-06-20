import { TicketCategoryEnum } from "@/shared/enums/ticket.enum";

// KB article status — BE serialize enum dạng STRING (JsonStringEnumConverter)
export const KbArticleStatusEnum = {
  Draft: "Draft",
  PendingReview: "PendingReview",
  Published: "Published",
  Archived: "Archived",
} as const;
export type KbArticleStatusEnum =
  (typeof KbArticleStatusEnum)[keyof typeof KbArticleStatusEnum];

export const KbArticleStatusLabel: Record<KbArticleStatusEnum, string> = {
  [KbArticleStatusEnum.Draft]: "Nháp",
  [KbArticleStatusEnum.PendingReview]: "Chờ duyệt",
  [KbArticleStatusEnum.Published]: "Đã xuất bản",
  [KbArticleStatusEnum.Archived]: "Lưu trữ",
};

// Giá trị số tương ứng — dùng khi gửi filter `?Status=` (BE nhận int)
export const KbArticleStatusCode: Record<KbArticleStatusEnum, number> = {
  [KbArticleStatusEnum.Draft]: 1,
  [KbArticleStatusEnum.PendingReview]: 2,
  [KbArticleStatusEnum.Published]: 3,
  [KbArticleStatusEnum.Archived]: 4,
};

// Version status — BE để field kiểu int raw → response trả SỐ
export const KbVersionStatusEnum = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
  Archived: 4,
} as const;
export type KbVersionStatusEnum =
  (typeof KbVersionStatusEnum)[keyof typeof KbVersionStatusEnum];

export const KbVersionStatusLabel: Record<KbVersionStatusEnum, string> = {
  [KbVersionStatusEnum.Pending]: "Chờ duyệt",
  [KbVersionStatusEnum.Approved]: "Đã duyệt",
  [KbVersionStatusEnum.Rejected]: "Bị từ chối",
  [KbVersionStatusEnum.Archived]: "Bản lưu",
};

// Reference type — BE serialize dạng STRING
export const KbReferenceTypeEnum = {
  ConsultedDuringResolve: "ConsultedDuringResolve",
  ProvidedToCustomer: "ProvidedToCustomer",
  GeneratedAfterResolve: "GeneratedAfterResolve",
} as const;
export type KbReferenceTypeEnum =
  (typeof KbReferenceTypeEnum)[keyof typeof KbReferenceTypeEnum];

export const KbReferenceTypeLabel: Record<KbReferenceTypeEnum, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]: "Tham khảo khi xử lý",
  [KbReferenceTypeEnum.ProvidedToCustomer]: "Cung cấp cho khách",
  [KbReferenceTypeEnum.GeneratedAfterResolve]: "Tạo sau khi xử lý",
};

// ── Category (KB share TicketCategoryEnum) ──
// Response trả category dạng STRING; filter `?Category=` cần SỐ → dùng KbCategoryCode.
export const KbCategoryLabel: Record<TicketCategoryEnum, string> = {
  [TicketCategoryEnum.Charging]: "Lỗi sạc",
  [TicketCategoryEnum.Overheat]: "Quá nhiệt",
  [TicketCategoryEnum.NoPower]: "Không có điện",
  [TicketCategoryEnum.Performance]: "Hiệu suất kém",
  [TicketCategoryEnum.Other]: "Khác",
  [TicketCategoryEnum.Repair]: "Yêu cầu sửa chữa",
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
