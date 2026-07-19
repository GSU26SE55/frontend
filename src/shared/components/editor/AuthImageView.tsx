import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useFileBlobUrl } from "@/shared/hooks/file/useFileBlobUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * NodeView của `AuthImageNode` — tải blob theo `fileId` rồi gán `src`.
 * Tách khỏi file định nghĩa Node để không vi phạm react-refresh
 * (một file không được vừa export component vừa export non-component).
 */
export function AuthImageView({ node, selected }: NodeViewProps) {
  const fileId = node.attrs.fileId as string;
  const alt = (node.attrs.alt as string) ?? "";
  const { data: url, isError } = useFileBlobUrl(fileId);

  return (
    <NodeViewWrapper as="span" className="inline-block max-w-full align-top">
      {isError ? (
        <span className="bg-muted text-muted-foreground inline-flex h-24 items-center justify-center rounded-md px-4 text-xs">
          Không tải được ảnh
        </span>
      ) : url ? (
        <img
          src={url}
          alt={alt}
          data-file-id={fileId}
          className={cn(
            "max-w-full rounded-md",
            selected && "ring-ring ring-2 ring-offset-2",
          )}
        />
      ) : (
        <Skeleton className="h-40 w-64 rounded-md" />
      )}
    </NodeViewWrapper>
  );
}
