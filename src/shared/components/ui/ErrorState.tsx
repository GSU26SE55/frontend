import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  /** Thông báo hiển thị. Mặc định: lỗi tải dữ liệu chung. */
  message?: string;
  /** Gọi refetch khi bấm "Thử lại". Không truyền → ẩn nút. */
  onRetry?: () => void;
  className?: string;
}

/**
 * State lỗi dùng chung cho list/detail khi query `isError`.
 * Trước đây nhiều page bỏ qua isError → lỗi mạng hiển thị nhầm thành empty state.
 */
export function ErrorState({
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ""}`}
    >
      <AlertTriangle className="size-8 text-destructive/70" />
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
