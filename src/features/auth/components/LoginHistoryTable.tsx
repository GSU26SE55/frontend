import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoginHistory } from '@/features/auth/hooks/useLoginHistory';
import { LoginAttemptResult } from '@/features/auth/types/account.types';

const RESULT_LABEL: Record<LoginAttemptResult, string> = {
  [LoginAttemptResult.Success]:           'Thành công',
  [LoginAttemptResult.WrongPassword]:     'Sai mật khẩu',
  [LoginAttemptResult.AccountNotFound]:   'Không tìm thấy',
  [LoginAttemptResult.AccountLocked]:     'Bị khóa',
  [LoginAttemptResult.AccountSuspended]:  'Bị tạm dừng',
  [LoginAttemptResult.AccountBanned]:     'Bị cấm',
  [LoginAttemptResult.AccountInactive]:   'Không hoạt động',
  [LoginAttemptResult.AccountNotVerified]:'Chưa xác minh',
};

const PAGE_SIZE = 10;

const LoginHistoryTable = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLoginHistory({ pageNumber: page, pageSize: PAGE_SIZE });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Chưa có lịch sử
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.result === LoginAttemptResult.Success ? 'default' : 'destructive'}>
                          {RESULT_LABEL[item.result] ?? item.resultName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.ipAddress ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={!data?.hasNextPage} onClick={() => setPage(page + 1)}>
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginHistoryTable;
