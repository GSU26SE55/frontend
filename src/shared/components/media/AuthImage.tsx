import { useEffect, useState } from "react";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthImageProps {
  fileId: string;
  alt?: string;
  className?: string;
}

/**
 * Loads an image from FileStorageService via axios (interceptor auto-attaches Bearer)
 * and displays it via an object URL. Used for images that require auth — a plain
 * `<img src>` usually can't send the token.
 */
// A file that just finished uploading may not be ready to download immediately (BE
// processing/save delay) — retry a few times before reporting an error, so the
// thumbnail doesn't wrongly show broken from a temporary delay.
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

export default function AuthImage({ fileId, alt, className }: AuthImageProps) {
  const [state, setState] = useState<{ url: string | null; error: boolean }>({
    url: null,
    error: false,
  });

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async (attempt: number) => {
      try {
        const res = await axiosInstance.get(ENDPOINTS.FILES.DOWNLOAD(fileId), {
          responseType: "blob",
        });
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setState({ url: objectUrl, error: false });
      } catch {
        if (!active) return;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          if (active) await load(attempt + 1);
        } else {
          setState({ url: null, error: true });
        }
      }
    };

    load(0);

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  const { url, error } = state;

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ""}`}
      >
        Failed to load image
      </div>
    );
  }

  if (!url) return <Skeleton className={className} />;

  return <img src={url} alt={alt} className={className} />;
}
