// Action codes for the GDPR file access audit (FileStorageService, #AUDIT-29) — GH-133 C5.
// Used as options for the `action` filter (closed-set dropdown — BE exact-match case-sensitive).
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
