import { useQuery } from '@tanstack/react-query';
import { QUERY_KEY } from '@/shared/utils/queryKeys';
import { fileStorageService } from '@/features/file-storage/services/file-storage.service';

export function useFileMetadata(fileId: string) {
  return useQuery({
    queryKey: QUERY_KEY.files.metadata(fileId),
    queryFn: () => fileStorageService.getFileMetadata(fileId).then((r) => r.data.data),
    enabled: !!fileId,
  });
}
