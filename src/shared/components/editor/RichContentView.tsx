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
 * Renders HTML content (Blog `contentHtml`, KB `content`).
 *
 * - ALWAYS goes through `sanitizeHtml` — the content may be AI-generated, so it isn't trusted.
 * - Images are stored as `<img data-file-id="...">` (see `AuthImageNode`): the file needs a Bearer
 *   token, so `src` must be loaded via axios and assigned an object URL rather than the raw API URL.
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
          if (active) img.alt = "Failed to load image";
        });
    });

    return () => {
      active = false;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [clean]);

  if (!clean) {
    return (
      <p className="text-muted-foreground text-sm italic">No content yet.</p>
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
