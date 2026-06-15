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
  const { data, isLoading } = useLoginHistory({ pageNumber: page, pageSize: PAGE_SIZE });

  const items = data?.items ?? [];
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Table — grows with content, no forced height */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/60">
              <TableHead className="w-1/4 text-xs font-semibold">Thời gian</TableHead>
              <TableHead className="w-1/4 text-xs font-semibold">Kết quả</TableHead>
              <TableHead className="w-1/4 text-xs font-semibold">Phương thức</TableHead>
              <TableHead className="w-1/4 text-xs font-semibold">Địa chỉ IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Monitor size={28} className="opacity-30" />
                    <p className="text-sm">Chưa có lịch sử đăng nhập</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="text-sm">
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.result === LoginAttemptResult.Success ? "default" : "destructive"}
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    >
                      {RESULT_LABEL[item.result] ?? item.resultName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.method}</TableCell>
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
        <span className="text-xs text-muted-foreground px-2 tabular-nums min-w-[48px] text-center">
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
