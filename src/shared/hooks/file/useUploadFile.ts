import { useMutation } from "@tanstack/react-query";
import { fileStorageService } from "@/shared/services/file-storage.service";
import type { UploadFilePayload } from "@/shared/types/file-storage.types";

export function useUploadFile() {
  return useMutation({
    mutationFn: (payload: UploadFilePayload) =>
      fileStorageService.uploadFile(payload).then((r) => r.data),
  });
}
