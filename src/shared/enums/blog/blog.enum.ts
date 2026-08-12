// Blog post status — the BE serializes this enum as a STRING (JsonStringEnumConverter)
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
  [BlogPostStatusEnum.Generating]: "Generating",
  [BlogPostStatusEnum.GenerationFailed]: "Generation failed",
  [BlogPostStatusEnum.Draft]: "Draft",
  [BlogPostStatusEnum.Published]: "Published",
  [BlogPostStatusEnum.Archived]: "Archived",
};

// Terminal states of the generate-from-kb flow — polling stops on either of these
export const BLOG_GENERATION_TERMINAL_STATUSES: BlogPostStatusEnum[] = [
  BlogPostStatusEnum.Draft,
  BlogPostStatusEnum.GenerationFailed,
];

// States that can't be edited (the BE returns 409 if you attempt a PUT)
export const BLOG_NON_EDITABLE_STATUSES: BlogPostStatusEnum[] = [
  BlogPostStatusEnum.Generating,
  BlogPostStatusEnum.Archived,
];

// Where the post came from — the BE serializes this as a STRING
export const BlogPostOriginEnum = {
  Manual: "Manual",
  AiGeneratedFromKb: "AiGeneratedFromKb",
} as const;
export type BlogPostOriginEnum =
  (typeof BlogPostOriginEnum)[keyof typeof BlogPostOriginEnum];

export const BlogPostOriginLabel: Record<BlogPostOriginEnum, string> = {
  [BlogPostOriginEnum.Manual]: "Created manually",
  [BlogPostOriginEnum.AiGeneratedFromKb]: "AI-generated from KB",
};

export const BLOG_STATUS_OPTIONS = (
  Object.values(BlogPostStatusEnum) as BlogPostStatusEnum[]
).map((s) => ({ value: s, label: BlogPostStatusLabel[s] }));

export const BLOG_ORIGIN_OPTIONS = (
  Object.values(BlogPostOriginEnum) as BlogPostOriginEnum[]
).map((o) => ({ value: o, label: BlogPostOriginLabel[o] }));
