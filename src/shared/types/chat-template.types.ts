export type ChatTemplateScope = "Personal" | "Team" | "Global";

export interface ChatTemplateDto {
  id: string;
  title: string;
  body: string;
  scope: ChatTemplateScope;
  createdBy: string;
  createdAt: string;
}

export interface CreateChatTemplatePayload {
  title: string;
  body: string;
  scope: ChatTemplateScope;
}

export interface UpdateChatTemplatePayload {
  title?: string;
  body?: string;
  scope?: ChatTemplateScope;
}

export interface ChatTemplateListParams {
  scope?: ChatTemplateScope;
  pageNumber?: number;
  pageSize?: number;
}
