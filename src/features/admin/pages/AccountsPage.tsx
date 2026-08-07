import { useState } from "react";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useUrlSort } from "@/shared/hooks/useUrlSort";
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch";
import DataPagination from "@/shared/components/ui/DataPagination";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  Plus,
  EllipsisVertical,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAccountList,
  useAdminUnlockAccount,
  useAdminDeleteAccount,
  useAdminReset2fa,
} from "@/features/admin/hooks/account/useAdminAccounts";
import { useAdminRoleList } from "@/features/admin/hooks/account/useAdminRoles";
import { AccountStatusEnum } from "@/shared/types/account/account.types";
import { toneClass, ACCOUNT_STATUS_TONE } from "@/shared/theme/statusColors";
import { UserRole } from "@/shared/types/account/session.types";
import InviteAccountDialog from "@/features/admin/components/account/InviteAccountDialog";
import CreateAccountDialog from "@/features/admin/components/account/CreateAccountDialog";
import EditAccountDialog from "@/features/admin/components/account/EditAccountDialog";
import ChangeAccountStatusDialog from "@/features/admin/components/account/ChangeAccountStatusDialog";
import ChangeRoleSubmenu from "@/features/admin/components/account/ChangeRoleSubmenu";
import AccountDetailDrawer from "@/features/admin/components/account/AccountDetailDrawer";
import EditStaffProfileDialog from "@/features/admin/components/account/EditStaffProfileDialog";
import MergeAccountDialog from "@/features/admin/components/account/MergeAccountDialog";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account/account.types";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { loadFailed, noData } from "@/shared/constants/emptyStates";

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [AccountStatusEnum.PendingVerification]: {
    label: "Chờ xác thực",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.PendingVerification]),
  },
  [AccountStatusEnum.Active]: {
    label: "Hoạt động",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.Active]),
  },
  [AccountStatusEnum.Locked]: {
    label: "Đã khóa",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.Locked]),
  },
  [AccountStatusEnum.Inactive]: {
    label: "Không hoạt động",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.Inactive]),
  },
  [AccountStatusEnum.Suspended]: {
    label: "Tạm khóa",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.Suspended]),
  },
  [AccountStatusEnum.Banned]: {
    label: "Bị cấm",
    cls: toneClass(ACCOUNT_STATUS_TONE[AccountStatusEnum.Banned]),
  },
};

const ROLE_CLS: Record<string, string> = {
  Admin: "bg-purple-100 text-purple-700",
  Manager: "bg-blue-100   text-blue-700",
  Staff: "bg-slate-100  text-slate-600",
  Customer: "bg-teal-100   text-teal-700",
};

type DialogState =
  | { type: "none" }
  | { type: "invite" }
  | { type: "create" }
  | { type: "edit"; account: AccountDto }
  | { type: "status"; account: AccountDto }
  | { type: "unlock"; account: AccountDto }
  | { type: "reset2fa"; account: AccountDto }
  | { type: "delete"; account: AccountDto }
  | { type: "detail"; account: AccountDto }
  | { type: "merge"; account: AccountDto }
  | { type: "staffProfile"; account: AccountDto };

const DEFAULTS = {
  keyword: "",
  sortBy: "",
  sortDir: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function AccountsPage() {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const { filters, setFilter, setFilters, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);
  const search = useDebouncedSearch(filters.keyword ?? "", (kw) =>
    setFilter("keyword", kw),
  );
  const sort = useUrlSort(filters.sortBy, filters.sortDir, setFilters);

  const { data, isLoading, isError, refetch } = useAdminAccountList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
    sortBy: filters.sortBy || undefined,
    sortDir: filters.sortDir || undefined,
  });
  // Fetch 1 lần cho cả bảng — submenu "Đổi role" ở mỗi hàng dùng chung danh sách này.
  const { data: rolesData } = useAdminRoleList({ pageSize: 100 });
  const roles = rolesData?.items ?? [];

  const { mutate: unlock } = useAdminUnlockAccount();
  const { mutate: deleteAccount, isPending: isDeleting } =
    useAdminDeleteAccount();
  const { mutate: reset2fa, isPending: isResetting2fa } = useAdminReset2fa();

  const accounts = data?.items ?? [];
  const total = data?.totalItems ?? 0;
  // BE đã sort toàn dataset (SortBy/SortDir) → render accounts nguyên trạng.
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  const close = () => setDialog({ type: "none" });

  const handleUnlock = (account: AccountDto) => {
    unlock(account.id, {
      onSuccess: () => toast.success(`Đã mở khóa ${account.fullName}`),
      onError: (err) => handleErrorApi({ error: err }),
    });
    close();
  };

  const handleDelete = (account: AccountDto) => {
    deleteAccount(account.id, {
      onSuccess: () => toast.success(`Đã xóa ${account.fullName}`),
      onError: (err) => handleErrorApi({ error: err }),
    });
    close();
  };

  const handleReset2fa = (account: AccountDto) => {
    reset2fa(account.id, {
      onSuccess: () => toast.success(`Đã reset 2FA cho ${account.fullName}`),
      onError: (err) => handleErrorApi({ error: err }),
    });
    close();
  };

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin · Người dùng
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "…" : total} tài khoản — Admin, Manager, Staff,
            Customer.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.admin.accounts]} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog({ type: "invite" })}
          >
            <Mail className="size-3.5" /> Mời người dùng
          </Button>
          <Button size="sm" onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-3.5" /> Tạo tài khoản
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={search.value}
            onChange={search.onChange}
            className="pl-8"
          />
        </div>
        {hasActiveFilter && (
          <Button size="sm" variant="ghost" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={loadFailed("tài khoản")}
            onRetry={() => refetch()}
          />
        ) : accounts.length === 0 ? (
          <EmptyState icon={Users} title={noData("tài khoản")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <SortableTableHead
                  sortKey="fullName"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                >
                  Người dùng
                </SortableTableHead>
                <SortableTableHead
                  sortKey="role"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                >
                  Roles
                </SortableTableHead>
                <SortableTableHead
                  sortKey="status"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                >
                  Trạng thái
                </SortableTableHead>
                <SortableTableHead
                  sortKey="createdAt"
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                >
                  Ngày tạo
                </SortableTableHead>
                <TableHead className="text-right">
                  {TABLE_COLUMNS.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc, index) => {
                const s = STATUS_MAP[acc.status] ?? {
                  label: String(acc.status),
                  cls: "bg-gray-100 text-gray-500",
                };
                const initials = acc.fullName
                  .split(" ")
                  .slice(-2)
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase();
                const isStaff = acc.role?.toUpperCase() === UserRole.STAFF;
                const isLocked = acc.status === AccountStatusEnum.Locked;

                return (
                  <TableRow key={acc.id}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {(filters.pageNumber - 1) * filters.pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials}
                        </span>
                        <div>
                          <div className="font-medium">{acc.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {acc.role ? (
                        <span
                          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${ROLE_CLS[acc.role] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {acc.role}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Chưa gán
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(acc.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            />
                          }
                        >
                          <EllipsisVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "edit", account: acc })
                            }
                          >
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "status", account: acc })
                            }
                          >
                            Đổi trạng thái
                          </DropdownMenuItem>
                          <ChangeRoleSubmenu account={acc} roles={roles} />
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "detail", account: acc })
                            }
                          >
                            Sessions & Lịch sử
                          </DropdownMenuItem>
                          {isStaff && (
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({
                                  type: "staffProfile",
                                  account: acc,
                                })
                              }
                            >
                              Hồ sơ Staff
                            </DropdownMenuItem>
                          )}
                          {acc.twoFactorEnabled && (
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({ type: "reset2fa", account: acc })
                              }
                            >
                              Reset 2FA
                            </DropdownMenuItem>
                          )}
                          {isLocked && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setDialog({ type: "unlock", account: acc })
                                }
                              >
                                Mở khóa
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "merge", account: acc })
                            }
                          >
                            Gộp tài khoản
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              setDialog({ type: "delete", account: acc })
                            }
                          >
                            Xóa tài khoản
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      <DataPagination
        totalItems={data?.totalItems ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasNextPage={data?.hasNextPage ?? false}
        hasPreviousPage={data?.hasPreviousPage ?? false}
        pageNumber={filters.pageNumber}
        pageSize={filters.pageSize}
        onPageChange={(p) => setFilter("pageNumber", p)}
        onPageSizeChange={(s) => setFilter("pageSize", s)}
      />

      {/* Dialogs */}
      <InviteAccountDialog open={dialog.type === "invite"} onClose={close} />
      <CreateAccountDialog open={dialog.type === "create"} onClose={close} />

      {dialog.type === "edit" && (
        <EditAccountDialog open onClose={close} account={dialog.account} />
      )}
      {dialog.type === "status" && (
        <ChangeAccountStatusDialog
          open
          onClose={close}
          account={dialog.account}
        />
      )}
      {dialog.type === "detail" && (
        <AccountDetailDrawer open onClose={close} account={dialog.account} />
      )}
      {dialog.type === "staffProfile" && (
        <EditStaffProfileDialog open onClose={close} account={dialog.account} />
      )}
      {dialog.type === "merge" && (
        <MergeAccountDialog open onClose={close} account={dialog.account} />
      )}

      {/* Unlock confirm */}
      <AlertDialog
        open={dialog.type === "unlock"}
        onOpenChange={(open: boolean) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận mở khóa</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === "unlock" && (
                <>
                  Bạn có chắc muốn mở khóa tài khoản{" "}
                  <strong>{dialog.account.fullName}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close} />
            <AlertDialogAction
              onClick={() =>
                dialog.type === "unlock" && handleUnlock(dialog.account)
              }
            >
              Mở khóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset 2FA confirm */}
      <AlertDialog
        open={dialog.type === "reset2fa"}
        onOpenChange={(open: boolean) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset 2FA</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === "reset2fa" && (
                <>
                  Xác thực 2 lớp của <strong>{dialog.account.fullName}</strong>{" "}
                  sẽ bị xóa (secret + backup codes). User phải enroll lại nếu
                  muốn dùng 2FA. Chỉ thực hiện sau khi đã xác minh danh tính
                  user qua kênh khác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close} />
            <AlertDialogAction
              variant="destructive"
              disabled={isResetting2fa}
              onClick={() =>
                dialog.type === "reset2fa" && handleReset2fa(dialog.account)
              }
            >
              {isResetting2fa && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Reset 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={dialog.type === "delete"}
        onOpenChange={(open: boolean) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === "delete" && (
                <>
                  Bạn có chắc muốn xóa tài khoản{" "}
                  <strong>{dialog.account.fullName}</strong>? Hành động này
                  không thể hoàn tác.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close} />
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() =>
                dialog.type === "delete" && handleDelete(dialog.account)
              }
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
