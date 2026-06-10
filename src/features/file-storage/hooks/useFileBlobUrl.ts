import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { fileStorageService } from "@/features/file-storage/services/file-storage.service";

export function useFileBlobUrl(fileId: string | undefined) {
  const blobUrlRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: QUERY_KEY.files.blob(fileId ?? ""),
    queryFn: async () => {
      const res = await fileStorageService.downloadFile(fileId!);
      const url = URL.createObjectURL(res.data);
      blobUrlRef.current = url;
      return url;
    },
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  return query;
}
