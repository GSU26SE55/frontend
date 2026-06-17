import { useEffect, useState } from "react";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";

/**
 * Tải file cần Bearer (`GET /api/files/{id}/download`) qua axios → tạo object URL
 * để render trong `<img>`. Object URL được revoke khi `fileId` đổi/unmount.
 *
 * Cố ý KHÔNG cache qua React Query: cache object URL sẽ trả về URL đã bị revoke
 * sau khi component unmount rồi remount trong gcTime → ảnh vỡ. Mỗi mount fetch lại
 * blob mới (giống pattern `AuthImage`).
 */
export function useFileBlobUrl(fileId: string | undefined) {
  const [state, setState] = useState<{ data: string | null; isError: boolean }>(
    { data: null, isError: false },
  );

  useEffect(() => {
    if (!fileId) return;
    let active = true;
    let objectUrl: string | null = null;

    axiosInstance
      .get(ENDPOINTS.FILES.DOWNLOAD(fileId), { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setState({ data: objectUrl, isError: false });
      })
      .catch(() => {
        if (active) setState({ data: null, isError: true });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  return { data: state.data, isError: state.isError };
}
