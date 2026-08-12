import { useEffect, useState } from "react";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";

/**
 * Downloads a file that requires Bearer auth (`GET /api/files/{id}/download`) via axios → creates
 * an object URL to render in `<img>`. The object URL is revoked when `fileId` changes/unmounts.
 *
 * Deliberately NOT cached via React Query: caching the object URL would return an already-revoked
 * URL after the component unmounts and remounts within gcTime → broken image. Each mount fetches a
 * fresh blob (same pattern as `AuthImage`).
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
