import { useState, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminPermissionList,
  useAdminRolePermissions,
  useAdminSetRolePermissions,
} from "@/features/admin/hooks/useAdminPermissions";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  RoleDto,
  PermissionDto,
} from "@/features/admin/types/admin.types";

interface Props {
  open: boolean;
  onClose: () => void;
  role: RoleDto;
}

export default function PermissionsDialog({ open, onClose, role }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const { data: allPermsData, isLoading: loadingAll } =
    useAdminPermissionList();
  const { data: rolePermsData, isLoading: loadingRole } =
    useAdminRolePermissions(role.id);
  const { mutate: setPerms, isPending: isSaving } =
    useAdminSetRolePermissions();

  const allPerms: PermissionDto[] = useMemo(
    () =>
      Array.isArray(allPermsData)
        ? allPermsData
        : (((allPermsData as unknown as { items?: unknown[] })?.items ??
            []) as PermissionDto[]),
    [allPermsData],
  );
  const rolePerms: PermissionDto[] = useMemo(
    () =>
      Array.isArray(rolePermsData)
        ? rolePermsData
        : (((rolePermsData as unknown as { items?: unknown[] })?.items ??
            []) as PermissionDto[]),
    [rolePermsData],
  );

  const checkedIds: Set<string> =
    selected ?? new Set(rolePerms.map((p) => p.id));

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = allPerms.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
    return filtered.reduce<Record<string, PermissionDto[]>>((acc, p) => {
      (acc[p.module] ??= []).push(p);
      return acc;
    }, {});
  }, [allPerms, search]);

  const toggle = (id: string) => {
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const toggleModule = (perms: PermissionDto[]) => {
    const allChecked = perms.every((p) => checkedIds.has(p.id));
    const next = new Set(checkedIds);
    perms.forEach((p) => {
      if (allChecked) {
        next.delete(p.id);
      } else {
        next.add(p.id);
      }
    });
    setSelected(next);
  };

  const handleSave = () => {
    if (checkedIds.size === 0) {
      setConfirmEmpty(true);
      return;
    }
    doSave();
  };

  const doSave = () => {
    setPerms(
      { roleId: role.id, payload: { permissionIds: Array.from(checkedIds) } },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật quyền");
          onClose();
        },
        onError: (err) => handleErrorApi({ error: err }),
      },
    );
  };

  const isLoading = loadingAll || loadingRole;

  return (
    <>
      <Dialog
        open={open && !confirmEmpty}
        onOpenChange={(v: boolean) => !v && onClose()}
      >
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Permissions — {role.name}</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm permission..."
              className="pl-8"
            />
          </div>

          {/* Permission list */}
          <div className="flex-1 overflow-y-auto space-y-4 py-1 pr-1">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Không tìm thấy permission nào.
              </p>
            ) : (
              Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([module, perms]) => {
                  const allChecked = perms.every((p) => checkedIds.has(p.id));
                  const someChecked =
                    !allChecked && perms.some((p) => checkedIds.has(p.id));
                  return (
                    <div key={module}>
                      <button
                        type="button"
                        onClick={() => toggleModule(perms)}
                        className="flex items-center gap-2 w-full text-left mb-1.5 group"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                            allChecked
                              ? "bg-primary border-primary text-primary-foreground"
                              : someChecked
                                ? "bg-primary/10 border-primary/50 text-primary"
                                : "border-border"
                          }`}
                        >
                          {allChecked ? "✓" : someChecked ? "−" : ""}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                          {module} ({perms.length})
                        </span>
                      </button>
                      <div className="pl-6 space-y-1">
                        {perms.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-start gap-2.5 cursor-pointer py-1 rounded hover:bg-muted/40 px-2 -mx-2"
                          >
                            <span
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                                checkedIds.has(p.id)
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border"
                              }`}
                            >
                              {checkedIds.has(p.id) ? "✓" : ""}
                            </span>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checkedIds.has(p.id)}
                              onChange={() => toggle(p.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-mono leading-none truncate">
                                {p.code}
                              </div>
                              {p.description && (
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {p.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div className="text-xs text-muted-foreground shrink-0 pt-1">
            Đã chọn {checkedIds.size} / {allPerms.length} permissions
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Lưu quyền
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm empty permissions */}
      <Dialog
        open={confirmEmpty}
        onOpenChange={(v: boolean) => setConfirmEmpty(v)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa hết quyền?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn chưa chọn permission nào. Role <strong>{role.name}</strong> sẽ
            không có bất kỳ quyền gì sau khi lưu. Bạn có chắc không?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmEmpty(false)}>
              Quay lại
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmEmpty(false);
                doSave();
              }}
            >
              Xóa hết quyền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
