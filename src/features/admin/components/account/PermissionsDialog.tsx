import { useState, useMemo } from "react";
import { Loader2, Search, CheckCheck, X } from "lucide-react";
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
} from "@/features/admin/hooks/account/useAdminPermissions";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  RoleDto,
  PermissionDto,
} from "@/features/admin/types/account/admin.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

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

  // IDs currently visible (per the filter) — used by "Select all / Clear".
  const visibleIds = useMemo(
    () => Object.values(grouped).flatMap((perms) => perms.map((p) => p.id)),
    [grouped],
  );

  const toggle = (id: string) => {
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleModule = (perms: PermissionDto[]) => {
    const allChecked = perms.every((p) => checkedIds.has(p.id));
    const next = new Set(checkedIds);
    perms.forEach((p) => (allChecked ? next.delete(p.id) : next.add(p.id)));
    setSelected(next);
  };

  const selectAllVisible = () => {
    const next = new Set(checkedIds);
    visibleIds.forEach((id) => next.add(id));
    setSelected(next);
  };

  const clearAllVisible = () => {
    const next = new Set(checkedIds);
    visibleIds.forEach((id) => next.delete(id));
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
          toast.success(ADMIN_MESSAGES.role.permissionsUpdated);
          onClose();
        },
        onError: (err) => handleErrorApi({ error: err }),
      },
    );
  };

  const isLoading = loadingAll || loadingRole;
  const modules = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <>
      <Dialog
        open={open && !confirmEmpty}
        onOpenChange={(v: boolean) => !v && onClose()}
      >
        <DialogContent className="sm:max-w-5xl w-[95vw] flex flex-col max-h-[88vh] gap-3">
          <DialogHeader>
            <DialogTitle>Permissions — {role.name}</DialogTitle>
          </DialogHeader>

          {/* Toolbar: search + select all / clear */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permissions (code / description)..."
                className="pl-9 h-10"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                onClick={selectAllVisible}
                disabled={isLoading || visibleIds.length === 0}
              >
                <CheckCheck className="mr-1.5 size-4" />
                Select all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                onClick={clearAllVisible}
                disabled={isLoading || visibleIds.length === 0}
              >
                <X className="mr-1.5 size-4" />
                Clear
              </Button>
            </div>
          </div>

          {/* Permission list — module cards laid out across multiple columns */}
          <div className="flex-1 overflow-y-auto -mr-1 pr-1">
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No matching permissions.
              </p>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
                {modules.map(([module, perms]) => {
                  const allChecked = perms.every((p) => checkedIds.has(p.id));
                  const someChecked =
                    !allChecked && perms.some((p) => checkedIds.has(p.id));
                  const checkedInModule = perms.filter((p) =>
                    checkedIds.has(p.id),
                  ).length;
                  return (
                    <div
                      key={module}
                      className="break-inside-avoid mb-3 rounded-lg border border-border bg-card/40 overflow-hidden"
                    >
                      {/* Module header — toggles the whole group */}
                      <button
                        type="button"
                        onClick={() => toggleModule(perms)}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <span
                          className={`size-5 rounded-md border flex items-center justify-center text-sm shrink-0 transition-colors ${
                            allChecked
                              ? "bg-primary border-primary text-primary-foreground"
                              : someChecked
                                ? "bg-primary/10 border-primary/50 text-primary"
                                : "border-border bg-background"
                          }`}
                        >
                          {allChecked ? "✓" : someChecked ? "−" : ""}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider flex-1 min-w-0 truncate">
                          {module}
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0">
                          {checkedInModule}/{perms.length}
                        </span>
                      </button>

                      {/* Permissions — tall rows, easy to hit */}
                      <div className="p-1.5 space-y-0.5">
                        {perms.map((p) => {
                          const on = checkedIds.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2.5 cursor-pointer py-1.5 px-2 rounded-md transition-colors ${
                                on ? "bg-primary/5" : "hover:bg-muted/50"
                              }`}
                            >
                              <span
                                className={`mt-0.5 size-5 rounded-md border flex items-center justify-center text-sm shrink-0 transition-colors ${
                                  on
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-border bg-background"
                                }`}
                              >
                                {on ? "✓" : ""}
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={on}
                                onChange={() => toggle(p.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-mono leading-tight break-all">
                                  {p.code}
                                </div>
                                {p.description && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {p.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 items-center sm:justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Selected{" "}
              <strong className="text-foreground tabular-nums">
                {checkedIds.size}
              </strong>{" "}
              / {allPerms.length} permissions
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save permissions
              </Button>
            </div>
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
            <DialogTitle>Remove all permissions?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            No permissions are selected. The <strong>{role.name}</strong> role
            will have no permissions at all after saving. Are you sure?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmEmpty(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmEmpty(false);
                doSave();
              }}
            >
              Remove all permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
