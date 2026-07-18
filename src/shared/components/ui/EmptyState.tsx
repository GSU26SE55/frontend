import { Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Icon minh hoạ. Mặc định Inbox. */
  icon?: LucideIcon;
  /** Dòng chính. Mặc định: chưa có dữ liệu. */
  title?: string;
  /** Mô tả phụ (tuỳ chọn). */
  description?: string;
  /** CTA (vd "Xóa bộ lọc" / "Tạo mới"). Không truyền → ẩn nút. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Empty state dùng chung — icon + text + CTA tuỳ chọn.
 * Thống nhất thay cho các "Không có… / Chưa có…" tự viết inline mỗi trang.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Chưa có dữ liệu",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-12 text-center ${className ?? ""}`}
    >
      <Icon className="size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
