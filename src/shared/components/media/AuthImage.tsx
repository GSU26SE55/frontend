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
// File vừa upload xong có thể chưa sẵn sàng để tải về ngay (BE xử lý/lưu trễ) — thử lại
// vài lần trước khi báo lỗi, tránh thumbnail bị treo lỗi oan vì trễ tạm thời.
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
        Không tải được ảnh
      </div>
    );
  }

  if (!url) return <Skeleton className={className} />;

  return <img src={url} alt={alt} className={className} />;
}
