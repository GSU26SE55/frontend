import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { fileStorageService } from "@/features/file-storage/services/file-storage.service";
import type { PresignedUrlOptions } from "@/features/file-storage/types/file-storage.types";

export function usePresignedUrl(fileId: string, options?: PresignedUrlOptions) {
  return useQuery({
    queryKey: QUERY_KEY.files.presignedUrl(fileId, options?.expiresInMinutes),
    queryFn: () =>
      fileStorageService
        .getPresignedUrl(fileId, options)
        .then((r) => r.data.data),
    enabled: !!fileId,
  });
}
