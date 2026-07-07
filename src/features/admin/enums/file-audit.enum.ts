// Action code cho audit truy cập file GDPR (FileStorageService, #AUDIT-29) — GH-133 C5.
// Dùng làm option filter `action` (dropdown closed-set — BE exact-match case-sensitive).
export const FileAuditActionCode = {
  FileUploaded: "FileUploaded",
  FileDownloaded: "FileDownloaded",
  FileDeleted: "FileDeleted",
  AccessDenied: "AccessDenied",
  PresignedUrlGenerated: "PresignedUrlGenerated",
  PresignedUrlRevoked: "PresignedUrlRevoked",
} as const;
export type FileAuditActionCode =
  (typeof FileAuditActionCode)[keyof typeof FileAuditActionCode];
