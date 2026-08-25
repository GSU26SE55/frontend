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
import { PAGE_SIZE_OPTIONS } from "@/shared/constants/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // Page beyond the data — a stale URL/bookmark, or data was just filtered/deleted down.
  const outOfRange =
    totalItems > 0 && (pageNumber - 1) * pageSize >= totalItems;

  // Auto-pull back to the last page that STILL has data.
  //
  // Why this is needed: the BE returns 200 + empty items for a page beyond the data (before
  // 08/02/2026 it threw a 500 from int overflow, so the FE never had to handle this state
  // before). Without pulling back, the screen contradicts itself: title says "4 battery types",
  // this bar says "Showing 0 / 4", but the table says "No battery types yet" — the user thinks
  // all the data is gone. The "Previous" button also only steps back 1 page at a time, so from
  // page 99 it'd take 98 clicks.
  //
  // No infinite loop: after pulling back, pageNumber = totalPages so outOfRange becomes false.
  // Every consumer of onPageChange genuinely updates state (all 29 spots have been checked),
  // so the next render is guaranteed to exit.
  useEffect(() => {
    if (outOfRange) onPageChange(totalPages);
  }, [outOfRange, totalPages, onPageChange]);

  if (totalItems === 0) return null;

  // outOfRange only exists for exactly 1 render before the effect above pulls back to the last
  // page. It still needs handling here, otherwise that render prints a nonsensical string like
  // "Showing 76–39 / 39".
  const from = (pageNumber - 1) * pageSize + 1;
  const to = Math.min(pageNumber * pageSize, totalItems);
  const pageRange = buildPageRange(pageNumber, totalPages);

  return (
    <div className="flex items-center justify-between px-1">
      {/* Left: total */}
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {outOfRange
          ? `Showing 0 / ${totalItems}`
          : `Showing ${from}–${to} / ${totalItems}`}
      </span>

      {/* Right: page size selector + pagination */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <>
            <span className="text-sm text-muted-foreground">Rows</span>
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
