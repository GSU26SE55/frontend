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
 * Tải ảnh từ FileStorageService qua axios (interceptor tự gắn Bearer) rồi hiển thị
 * bằng object URL. Dùng cho ảnh cần auth — `<img src>` thường không gửi được token.
 */
export default function AuthImage({ fileId, alt, className }: AuthImageProps) {
  const [state, setState] = useState<{ url: string | null; error: boolean }>({
    url: null,
    error: false,
  });

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    axiosInstance
      .get(ENDPOINTS.FILES.DOWNLOAD(fileId), { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setState({ url: objectUrl, error: false });
      })
      .catch(() => {
        if (active) setState({ url: null, error: true });
      });

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
        Không tải được ảnh
      </div>
    );
  }

  if (!url) return <Skeleton className={className} />;

  return <img src={url} alt={alt} className={className} />;
}
