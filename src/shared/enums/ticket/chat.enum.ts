// Phong cách gợi ý AI cho endpoint POST /api/tickets/{id}/chats/suggest (docs/api-ticket.md §309).
// BE gửi/nhận string name (TicketService cấu hình JsonStringEnumConverter).
export const ChatAiIntentEnum = {
  RequestInfo: "RequestInfo", // Yêu cầu thêm thông tin từ Customer
  TechnicalAnswer: "TechnicalAnswer", // Trả lời kỹ thuật (mặc định)
  Resolution: "Resolution", // Đề xuất giải pháp xử lý
  FollowUp: "FollowUp", // Theo dõi tiến độ
} as const;
export type ChatAiIntentEnum =
  (typeof ChatAiIntentEnum)[keyof typeof ChatAiIntentEnum];

// Trạng thái transcribe của chat thoại (TicketChatDTO.voiceTranscriptionStatus, docs/api-ticket.md).
// Chat tạo qua POST /chats/voice → transcribe async: Pending → Processing → Completed | Failed.
// Failed cho phép gọi POST /chats/{id}/voice/retry. BE serialize dạng string.
export const VoiceTranscriptionStatusEnum = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
} as const;
export type VoiceTranscriptionStatusEnum =
  (typeof VoiceTranscriptionStatusEnum)[keyof typeof VoiceTranscriptionStatusEnum];
