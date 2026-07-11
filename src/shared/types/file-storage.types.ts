import type {
  FilePurposeEnum,
  FileStatusEnum,
} from "@/shared/enums/file-storage.enum";
export {
  FilePurposeEnum,
  FileStatusEnum,
} from "@/shared/enums/file-storage.enum";

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
