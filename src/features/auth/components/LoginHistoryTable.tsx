import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { useLoginHistory } from "@/features/auth/hooks/useLoginHistory";
import { LoginAttemptResult } from "@/features/auth/types/account.types";
import { SortableTableHead } from "@/shared/components/common/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

const RESULT_LABEL: Record<LoginAttemptResult, string> = {
  [LoginAttemptResult.Success]: "Thành công",
  [LoginAttemptResult.WrongPassword]: "Sai mật khẩu",
  [LoginAttemptResult.AccountNotFound]: "Không tìm thấy",
  [LoginAttemptResult.AccountLocked]: "Bị khóa",
  [LoginAttemptResult.AccountSuspended]: "Tạm dừng",
  [LoginAttemptResult.AccountBanned]: "Bị cấm",
  [LoginAttemptResult.AccountInactive]: "Không hoạt động",
  [LoginAttemptResult.AccountNotVerified]: "Chưa xác minh",
};

const PAGE_SIZE = 10;

const LoginHistoryTable = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLoginHistory({
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData(items, (item, key) => {
      switch (key) {
        case "createdAt":
          return new Date(item.createdAt);
        case "result":
          return RESULT_LABEL[item.result] ?? item.resultName;
        case "method":
          return item.method;
        case "ipAddress":
          return item.ipAddress ?? "";
        default:
          return null;
      }
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Table — grows with content, no forced height */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/60">
              <TableHead className="w-12 text-center text-xs font-semibold">
                STT
              </TableHead>
              <SortableTableHead
                sortKey="createdAt"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-1/4 text-xs font-semibold"
              >
                Thời gian
              </SortableTableHead>
              <SortableTableHead
                sortKey="result"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-1/4 text-xs font-semibold"
              >
                Kết quả
              </SortableTableHead>
              <SortableTableHead
                sortKey="method"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-1/4 text-xs font-semibold"
              >
                Phương thức
              </SortableTableHead>
              <SortableTableHead
                sortKey="ipAddress"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={toggleSort}
                className="w-1/4 text-xs font-semibold"
              >
                Địa chỉ IP
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Monitor size={28} className="opacity-30" />
                    <p className="text-sm">Chưa có lịch sử đăng nhập</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((item, index) => (
                <TableRow key={item.id} className="text-sm">
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.result === LoginAttemptResult.Success
                          ? "default"
                          : "destructive"
                      }
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    >
                      {RESULT_LABEL[item.result] ?? item.resultName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.method}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={13} />
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums min-w-12 text-center">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={!data?.hasNextPage || isLoading}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={13} />
        </Button>
      </div>
    </div>
  );
};

export default LoginHistoryTable;
