export const FilePurposeEnum = {
  Other: 0,
  Avatar: 1,
  TicketAttachment: 2,
  MaintenancePhoto: 3,
  KbImage: 4,
  Firmware: 5,
} as const;
export type FilePurposeEnum =
  (typeof FilePurposeEnum)[keyof typeof FilePurposeEnum];

export const FileStatusEnum = {
  Uploaded: 0,
  Processing: 1,
  Ready: 2,
  Quarantined: 3,
  Deleted: 4,
} as const;
export type FileStatusEnum =
  (typeof FileStatusEnum)[keyof typeof FileStatusEnum];

export interface FileUploadResponse {
  fileId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
  publicUrl: string | null;
}

export interface FileMetadataResponse {
  fileId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  size: number;
  folderName: string;
  purpose: FilePurposeEnum;
  status: FileStatusEnum;
  publicUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UploadFilePayload {
  file: File;
  folderName?: string;
  purpose?: FilePurposeEnum;
}

export interface PresignedUrlOptions {
  expiresInMinutes?: number;
}
