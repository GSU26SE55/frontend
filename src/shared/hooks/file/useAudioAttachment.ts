import { useQuery } from "@tanstack/react-query";
import { fileStorageService } from "@/shared/services/file/file-storage.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only accepts a fileId that's a valid GUID — filters out junk/legacy URLs that would 404 when appended to /api/files/{id}. */
export function isFileId(s: string | undefined | null): s is string {
  return !!s && GUID_RE.test(s.trim());
}

interface AudioAttachmentResult {
  /** true when contentType starts with "audio/". undefined while not yet loaded. */
  isAudio?: boolean;
  contentType?: string;
  isLoading: boolean;
}

/**
 * Detects whether an attachment is audio via its metadata (contentType). The list endpoint only
 * returns fileId (no contentType), so this queries /api/files/{id}/metadata. The result is cached
 * for a long time (contentType is immutable) — each voice bubble fetches once and shares the cache app-wide.
 *
 * `enabled=false` (fileId isn't a GUID) → skips the call, treated as not audio.
 */
export function useAudioAttachment(
  fileId: string | undefined,
): AudioAttachmentResult {
  const valid = isFileId(fileId);
  const id = valid ? fileId!.trim() : "";

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY.files.metadata(id),
    queryFn: async () => {
      const res = await fileStorageService.getFileMetadata(id);
      return res.data.data ?? null;
    },
    enabled: valid,
    staleTime: 60 * 60 * 1000, // 1h — contentType doesn't change
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    isAudio: data
      ? data.contentType?.toLowerCase().startsWith("audio/")
      : undefined,
    contentType: data?.contentType,
    isLoading: valid && isLoading,
  };
}
