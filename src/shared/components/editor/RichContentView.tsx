import { useEffect, useMemo, useRef } from "react";
import { sanitizeHtml } from "@/shared/lib/sanitizeHtml";
import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import { cn } from "@/lib/utils";

interface RichContentViewProps {
  html?: string | null;
  className?: string;
}

/**
 * Render nội dung HTML (Blog `contentHtml`, KB `content`).
 *
 * - LUÔN đi qua `sanitizeHtml` — nội dung có thể do AI sinh, không tin được.
 * - Ảnh lưu dạng `<img data-file-id="...">` (xem `AuthImageNode`): file cần Bearer
 *   token nên `src` phải nạp bằng axios rồi gán object URL, không đặt thẳng URL API.
 */
export function RichContentView({ html, className }: RichContentViewProps) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let active = true;
    const objectUrls: string[] = [];

    const imgs = Array.from(
      root.querySelectorAll<HTMLImageElement>("img[data-file-id]"),
    );

    imgs.forEach((img) => {
      const fileId = img.getAttribute("data-file-id");
      if (!fileId) return;
      axiosInstance
        .get(ENDPOINTS.FILES.DOWNLOAD(fileId), { responseType: "blob" })
        .then((res) => {
          if (!active) return;
          const url = URL.createObjectURL(res.data as Blob);
          objectUrls.push(url);
          img.src = url;
        })
        .catch(() => {
          if (active) img.alt = "Không tải được ảnh";
        });
    });

    return () => {
      active = false;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [clean]);

  if (!clean) {
    return (
      <p className="text-muted-foreground text-sm italic">Chưa có nội dung.</p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("rich-content text-sm leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
