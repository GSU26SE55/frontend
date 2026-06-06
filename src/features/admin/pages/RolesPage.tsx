import { useState } from "react";
import {
  Shield,
  Plus,
  Lock,
  CheckCircle,
  MoreHorizontal,
  Loader2,
  Edit2,
  ToggleLeft,
  Key,
  Trash2,
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
  useAdminRoleList,
  useAdminDeleteRole,
} from "@/features/admin/hooks/useAdminRoles";
import { RoleStatusEnum } from "@/features/admin/types/admin.types";
import CreateRoleDialog from "@/features/admin/components/CreateRoleDialog";
import EditRoleDialog from "@/features/admin/components/EditRoleDialog";
import ChangeRoleStatusDialog from "@/features/admin/components/ChangeRoleStatusDialog";
import PermissionsDialog from "@/features/admin/components/PermissionsDialog";
import { handleErrorApi } from "@/shared/lib/errors";
import type { RoleDto } from "@/features/admin/types/admin.types";

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  [RoleStatusEnum.Active]: {
    label: "Hoạt động",
    cls: "bg-emerald-100 text-emerald-700",
  },
  [RoleStatusEnum.Inactive]: { label: "Tắt", cls: "bg-gray-100 text-gray-500" },
  [RoleStatusEnum.Deprecated]: {
    label: "Deprecated",
    cls: "bg-amber-100 text-amber-700",
  },
};

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; role: RoleDto }
  | { type: "status"; role: RoleDto }
  | { type: "perms"; role: RoleDto }
  | { type: "delete"; role: RoleDto };

export default function RolesPage() {
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });

  const { data, isLoading } = useAdminRoleList({ pageNumber: 1, pageSize: 50 });
  const { mutate: deleteRole, isPending: isDeleting } = useAdminDeleteRole();

  const raw = data as unknown;
  const roles = Array.isArray(raw)
    ? raw
    : (((raw as { items?: unknown[] })?.items ?? []) as RoleDto[]);
  const total =
    (raw as { totalItems?: number })?.totalItems ??
    (Array.isArray(raw) ? raw.length : 0);

  const close = () => setDialog({ type: "none" });

  const handleDelete = (role: RoleDto) => {
    deleteRole(role.id, {
      onSuccess: () => toast.success(`Đã xóa role ${role.name}`),
      onError: (err) => handleErrorApi({ error: err }),
    });
    close();
  };

  return (
    <div className="p-6 space-y-5 max-w-[1440px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Admin · Người dùng
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "…" : total} role — quản lý quyền truy cập hệ thống.
          </p>
        </div>
        <button
          onClick={() => setDialog({ type: "create" })}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus size={14} /> Tạo role
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-5 space-y-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Shield size={32} className="opacity-30" />
          <span className="text-sm">Chưa có role nào.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const s = STATUS_MAP[role.status] ?? {
              label: String(role.status),
              cls: "bg-gray-100 text-gray-500",
            };
            return (
              <div
                key={role.id}
                className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:border-emerald-300 transition-colors"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${role.isSystemRole ? "bg-purple-100" : "bg-emerald-100"}`}
                    >
                      {role.isSystemRole ? (
                        <Lock size={14} className="text-purple-600" />
                      ) : (
                        <Shield size={14} className="text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[13.5px]">
                        {role.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {role.normalizedName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                    >
                      {s.label}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <MoreHorizontal size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setDialog({ type: "edit", role })}
                        >
                          <Edit2 className="mr-2 size-4" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDialog({ type: "status", role })}
                        >
                          <ToggleLeft className="mr-2 size-4" /> Đổi trạng thái
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDialog({ type: "perms", role })}
                        >
                          <Key className="mr-2 size-4" /> Quản lý quyền
                        </DropdownMenuItem>
                        {!role.isSystemRole && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() =>
                                setDialog({ type: "delete", role })
                              }
                            >
                              <Trash2 className="mr-2 size-4" /> Xóa role
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Description */}
                {role.description && (
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {role.isSystemRole ? (
                      <>
                        <Lock size={11} />
                        <span>System role</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={11} className="text-emerald-500" />
                        <span>Custom role</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(role.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateRoleDialog open={dialog.type === "create"} onClose={close} />

      {dialog.type === "edit" && (
        <EditRoleDialog open onClose={close} role={dialog.role} />
      )}
      {dialog.type === "status" && (
        <ChangeRoleStatusDialog open onClose={close} role={dialog.role} />
      )}
      {dialog.type === "perms" && (
        <PermissionsDialog open onClose={close} role={dialog.role} />
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={dialog.type === "delete"}
        onOpenChange={(open: boolean) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa role?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === "delete" && (
                <>
                  Bạn có chắc muốn xóa role <strong>{dialog.role.name}</strong>?
                  Hành động này không thể hoàn tác.
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
                dialog.type === "delete" && handleDelete(dialog.role)
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
