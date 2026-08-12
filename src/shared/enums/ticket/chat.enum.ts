// AI suggestion style for the POST /api/tickets/{id}/chats/suggest endpoint
// (docs/api-ticket.md §309).
// The BE sends/receives string names (TicketService configures JsonStringEnumConverter).
export const ChatAiIntentEnum = {
  RequestInfo: "RequestInfo", // Ask the Customer for more information
  TechnicalAnswer: "TechnicalAnswer", // Technical answer (default)
  Resolution: "Resolution", // Propose a fix
  FollowUp: "FollowUp", // Follow up on progress
} as const;
export type ChatAiIntentEnum =
  (typeof ChatAiIntentEnum)[keyof typeof ChatAiIntentEnum];

// Transcription status of a voice chat (TicketChatDTO.voiceTranscriptionStatus,
// docs/api-ticket.md).
// A chat created via POST /chats/voice is transcribed asynchronously:
// Pending → Processing → Completed | Failed.
// Failed allows a call to POST /chats/{id}/voice/retry. The BE serializes this as a string.
export const VoiceTranscriptionStatusEnum = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
} as const;
export type VoiceTranscriptionStatusEnum =
  (typeof VoiceTranscriptionStatusEnum)[keyof typeof VoiceTranscriptionStatusEnum];
