import axiosInstance from '@/shared/lib/axios';
import { ENDPOINTS } from '@/shared/utils/endpoints';
import type { CommonResponse } from '@/shared/types/api.types';
import type {
  FileUploadResponse,
  FileMetadataResponse,
  UploadFilePayload,
  PresignedUrlOptions,
} from '@/features/file-storage/types/file-storage.types';

export const fileStorageService = {
  uploadFile: (payload: UploadFilePayload) => {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.folderName) form.append('folderName', payload.folderName);
    if (payload.purpose !== undefined) form.append('purpose', String(payload.purpose));
    return axiosInstance.post<CommonResponse<FileUploadResponse>>(ENDPOINTS.FILES.UPLOAD, form);
  },

  getFileMetadata: (id: string) =>
    axiosInstance.get<CommonResponse<FileMetadataResponse>>(ENDPOINTS.FILES.METADATA(id)),

  getPresignedUrl: (id: string, options?: PresignedUrlOptions) =>
    axiosInstance.get<CommonResponse<string>>(ENDPOINTS.FILES.PRESIGNED_URL(id), {
      params: options?.expiresInMinutes !== undefined
        ? { expiresInMinutes: options.expiresInMinutes }
        : undefined,
    }),

  deleteFile: (id: string) =>
    axiosInstance.delete<CommonResponse<null>>(ENDPOINTS.FILES.DELETE(id)),
};
