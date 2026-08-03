import { useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface DataPaginationProps {
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

function buildPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}

export default function DataPagination({
  totalItems,
  pageNumber,
  pageSize,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataPaginationProps) {
  // Trang vượt quá dữ liệu — URL/bookmark cũ, hoặc dữ liệu vừa bị lọc/xoá bớt.
  const outOfRange =
    totalItems > 0 && (pageNumber - 1) * pageSize >= totalItems;

  // Tự kéo về trang cuối CÒN dữ liệu.
  //
  // Vì sao cần: BE trả 200 + items rỗng cho trang vượt quá dữ liệu (trước 02/08/2026 nó ném 500 do
  // tràn int, nên FE chưa bao giờ phải xử lý trạng thái này). Không kéo về thì màn hình tự mâu thuẫn:
  // tiêu đề "4 loại pin", thanh này "Hiển thị 0 / 4", nhưng bảng lại báo "Chưa có loại pin nào" —
  // người dùng tưởng mất sạch dữ liệu. Nút "Trước" cũng chỉ lùi 1 trang, từ trang 99 phải bấm 98 lần.
  //
  // Không lặp vô hạn: sau khi kéo về, pageNumber = totalPages nên outOfRange thành false. Mọi consumer
  // của onPageChange đều thực sự cập nhật state (đã rà cả 29 chỗ), nên lần render sau chắc chắn thoát.
  useEffect(() => {
    if (outOfRange) onPageChange(totalPages);
  }, [outOfRange, totalPages, onPageChange]);

  if (totalItems === 0) return null;

  // outOfRange chỉ tồn tại trong đúng 1 lần render trước khi effect ở trên kéo về trang cuối.
  // Vẫn phải xử lý ở đây, nếu không lần render đó in ra chuỗi vô nghĩa kiểu "Hiển thị 76–39 / 39".
  const from = (pageNumber - 1) * pageSize + 1;
  const to = Math.min(pageNumber * pageSize, totalItems);
  const pageRange = buildPageRange(pageNumber, totalPages);

  return (
    <div className="flex items-center justify-between px-1">
      {/* Left: total */}
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {outOfRange
          ? `Hiển thị 0 / ${totalItems}`
          : `Hiển thị ${from}–${to} / ${totalItems}`}
      </span>

      {/* Right: page size selector + pagination */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <>
            <span className="text-sm text-muted-foreground">Dòng</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              items={pageSizeOptions.map((s) => ({
                value: String(s),
                label: String(s),
              }))}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-0 w-auto"
              >
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPreviousPage) onPageChange(pageNumber - 1);
                }}
                disabled={!hasPreviousPage}
                aria-disabled={!hasPreviousPage}
              />
            </PaginationItem>

            {pageRange.map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === pageNumber}
                    onClick={(e) => {
                      e.preventDefault();
                      if (p !== pageNumber) onPageChange(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (hasNextPage) onPageChange(pageNumber + 1);
                }}
                disabled={!hasNextPage}
                aria-disabled={!hasNextPage}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
