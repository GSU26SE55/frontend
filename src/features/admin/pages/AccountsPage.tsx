import { useState } from "react";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import DataPagination from "@/shared/components/common/DataPagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Mail,
  Plus,
  MoreHorizontal,
  Users,
  Edit2,
  Shield,
  KeyRound,
  Trash2,
  MonitorSmartphone,
  UserCog,
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
} from "@/features/admin/hooks/useAdminAccounts";
import { AccountStatusEnum } from "@/shared/types/account.types";
import { UserRole } from "@/shared/types/session.types";
import InviteAccountDialog from "@/features/admin/components/InviteAccountDialog";
import CreateAccountDialog from "@/features/admin/components/CreateAccountDialog";
import EditAccountDialog from "@/features/admin/components/EditAccountDialog";
import ChangeAccountStatusDialog from "@/features/admin/components/ChangeAccountStatusDialog";
import ChangeRoleDialog from "@/features/admin/components/ChangeRoleDialog";
import AccountDetailDrawer from "@/features/admin/components/AccountDetailDrawer";
import EditStaffProfileDialog from "@/features/admin/components/EditStaffProfileDialog";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [AccountStatusEnum.PendingVerification]: {
    label: "Chờ xác thực",
    cls: "bg-amber-100 text-amber-700",
  },
  [AccountStatusEnum.Active]: {
    label: "Hoạt động",
    cls: "bg-emerald-100 text-emerald-700",
  },
  [AccountStatusEnum.Locked]: {
    label: "Đã khóa",
    cls: "bg-red-100 text-red-600",
  },
  [AccountStatusEnum.Inactive]: {
    label: "Không hoạt động",
    cls: "bg-gray-100 text-gray-500",
  },
  [AccountStatusEnum.Suspended]: {
    label: "Tạm khóa",
    cls: "bg-orange-100 text-orange-700",
  },
  [AccountStatusEnum.Banned]: {
    label: "Bị cấm",
    cls: "bg-red-200 text-red-700",
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
  | { type: "role"; account: AccountDto }
  | { type: "unlock"; account: AccountDto }
  | { type: "delete"; account: AccountDto }
  | { type: "detail"; account: AccountDto }
  | { type: "staffProfile"; account: AccountDto };

const DEFAULTS = { keyword: "", pageNumber: 1, pageSize: 10 };

export default function AccountsPage() {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const { filters, setFilter, resetFilters, hasActiveFilter } =
    useUrlFilters(DEFAULTS);

  const { data, isLoading } = useAdminAccountList({
    pageNumber: filters.pageNumber,
    pageSize: filters.pageSize,
    keyword: filters.keyword || undefined,
  });
  const { mutate: unlock } = useAdminUnlockAccount();
  const { mutate: deleteAccount, isPending: isDeleting } =
    useAdminDeleteAccount();

  const accounts = data?.items ?? [];
  const total = data?.totalItems ?? 0;

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

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
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

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Danh sách tài khoản
            </h2>
            <p className="text-sm text-muted-foreground">
              Quản lý hồ sơ, role, trạng thái và phiên đăng nhập.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tên, email..."
                value={filters.keyword}
                onChange={(e) =>
                  setFilter("keyword", e.target.value || undefined)
                }
                className="pl-8"
              />
            </div>
            {hasActiveFilter && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Users size={32} className="opacity-30" />
            <span className="text-sm">Chưa có tài khoản nào.</span>
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Người dùng", "Roles", "Trạng thái", "Ngày tạo", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
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
                  <tr
                    key={acc.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials}
                        </span>
                        <div>
                          <div className="font-medium">{acc.fullName}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {acc.role ? (
                          <span
                            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${ROLE_CLS[acc.role] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {acc.role}
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-muted-foreground italic">
                            Chưa gán
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                      {new Date(acc.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <MoreHorizontal size={15} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "edit", account: acc })
                            }
                          >
                            <Edit2 className="mr-2 size-4" /> Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "status", account: acc })
                            }
                          >
                            <Shield className="mr-2 size-4" /> Đổi trạng thái
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "role", account: acc })
                            }
                          >
                            <UserCog className="mr-2 size-4" /> Đổi role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ type: "detail", account: acc })
                            }
                          >
                            <MonitorSmartphone className="mr-2 size-4" />{" "}
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
                              <UserCog className="mr-2 size-4" /> Hồ sơ Staff
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
                                <KeyRound className="mr-2 size-4" /> Mở khóa
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              setDialog({ type: "delete", account: acc })
                            }
                          >
                            <Trash2 className="mr-2 size-4" /> Xóa tài khoản
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      {dialog.type === "role" && (
        <ChangeRoleDialog open onClose={close} account={dialog.account} />
      )}
      {dialog.type === "detail" && (
        <AccountDetailDrawer open onClose={close} account={dialog.account} />
      )}
      {dialog.type === "staffProfile" && (
        <EditStaffProfileDialog open onClose={close} account={dialog.account} />
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
