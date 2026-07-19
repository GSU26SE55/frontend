// Blog post status — BE serialize enum dạng STRING (JsonStringEnumConverter)
export const BlogPostStatusEnum = {
  Generating: "Generating",
  GenerationFailed: "GenerationFailed",
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;
export type BlogPostStatusEnum =
  (typeof BlogPostStatusEnum)[keyof typeof BlogPostStatusEnum];

export const BlogPostStatusLabel: Record<BlogPostStatusEnum, string> = {
  [BlogPostStatusEnum.Generating]: "Đang tạo",
  [BlogPostStatusEnum.GenerationFailed]: "Tạo thất bại",
  [BlogPostStatusEnum.Draft]: "Nháp",
  [BlogPostStatusEnum.Published]: "Đã xuất bản",
  [BlogPostStatusEnum.Archived]: "Lưu trữ",
};

// Trạng thái kết thúc của luồng generate-from-kb — poll dừng khi gặp 1 trong 2
export const BLOG_GENERATION_TERMINAL_STATUSES: BlogPostStatusEnum[] = [
  BlogPostStatusEnum.Draft,
  BlogPostStatusEnum.GenerationFailed,
];

// Trạng thái không cho phép chỉnh sửa (BE trả 409 nếu cố PUT)
export const BLOG_NON_EDITABLE_STATUSES: BlogPostStatusEnum[] = [
  BlogPostStatusEnum.Generating,
  BlogPostStatusEnum.Archived,
];

// Nguồn gốc bài viết — BE serialize dạng STRING
export const BlogPostOriginEnum = {
  Manual: "Manual",
  AiGeneratedFromKb: "AiGeneratedFromKb",
} as const;
export type BlogPostOriginEnum =
  (typeof BlogPostOriginEnum)[keyof typeof BlogPostOriginEnum];

export const BlogPostOriginLabel: Record<BlogPostOriginEnum, string> = {
  [BlogPostOriginEnum.Manual]: "Tạo thủ công",
  [BlogPostOriginEnum.AiGeneratedFromKb]: "AI tạo từ KB",
};

export const BLOG_STATUS_OPTIONS = (
  Object.values(BlogPostStatusEnum) as BlogPostStatusEnum[]
).map((s) => ({ value: s, label: BlogPostStatusLabel[s] }));

export const BLOG_ORIGIN_OPTIONS = (
  Object.values(BlogPostOriginEnum) as BlogPostOriginEnum[]
).map((o) => ({ value: o, label: BlogPostOriginLabel[o] }));
