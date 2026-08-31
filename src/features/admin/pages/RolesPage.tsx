import { useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Lock,
  EllipsisVertical,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  useAdminRoleList,
  useAdminDeleteRole,
} from "@/features/admin/hooks/account/useAdminRoles";
import {
  RoleStatusEnum,
  RoleTypeFilter,
} from "@/features/admin/types/account/admin.types";
import CreateRoleDialog from "@/features/admin/components/account/CreateRoleDialog";
import EditRoleDialog from "@/features/admin/components/account/EditRoleDialog";
import ChangeRoleStatusDialog from "@/features/admin/components/account/ChangeRoleStatusDialog";
import PermissionsDialog from "@/features/admin/components/account/PermissionsDialog";
import { handleErrorApi } from "@/shared/lib/errors";
import type { RoleDto } from "@/features/admin/types/account/admin.types";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { loadFailed, notFound } from "@/shared/constants/emptyStates";
import { formatDate } from "@/shared/utils/datetime";

const STATUS_VARIANT: Record<
  number,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  [RoleStatusEnum.Active]: { label: "Active", variant: "default" },
  [RoleStatusEnum.Inactive]: { label: "Inactive", variant: "outline" },
  [RoleStatusEnum.Deprecated]: { label: "Deprecated", variant: "secondary" },
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
  const [keyword, setKeyword] = useState("");
  const [roleType, setRoleType] = useState<RoleTypeFilter>(RoleTypeFilter.All);

  const { data, isLoading, isError, refetch } = useAdminRoleList({
    pageNumber: 1,
    pageSize: 50,
  });
  const { mutate: deleteRole, isPending: isDeleting } = useAdminDeleteRole();

  const raw = data as unknown;
  const roles = useMemo(
    () =>
      Array.isArray(raw)
        ? raw
        : (((raw as { items?: unknown[] })?.items ?? []) as RoleDto[]),
    [raw],
  );
  const total =
    (raw as { totalItems?: number })?.totalItems ??
    (Array.isArray(raw) ? raw.length : 0);

  const filteredRoles = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesKeyword =
        !q ||
        [role.name, role.normalizedName, role.description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q));
      const matchesType =
        roleType === RoleTypeFilter.All ||
        (roleType === RoleTypeFilter.System && role.isSystemRole) ||
        (roleType === RoleTypeFilter.Custom && !role.isSystemRole);

      return matchesKeyword && matchesType;
    });
  }, [roles, keyword, roleType]);

  const close = () => setDialog({ type: "none" });

  const handleDelete = (role: RoleDto) => {
    deleteRole(role.id, {
      onSuccess: () => toast.success(`Role ${role.name} deleted`),
      onError: (err) => handleErrorApi({ error: err }),
    });
    close();
  };

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Configure
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : total} roles &mdash; manage system access
            permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setDialog({ type: "create" })}>
            <Plus className="size-3.5" /> Create role
          </Button>
          <RefreshButton queryKeys={[KEY.admin.roles]} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by role name..."
            className="pl-8"
          />
        </div>

        <Select
          value={roleType}
          items={[
            { value: RoleTypeFilter.All, label: "All" },
            { value: RoleTypeFilter.System, label: "Default" },
            { value: RoleTypeFilter.Custom, label: "Custom" },
          ]}
          onValueChange={(v) =>
            setRoleType((v as RoleTypeFilter) ?? RoleTypeFilter.All)
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Role type" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={RoleTypeFilter.All}>All</SelectItem>
            <SelectItem value={RoleTypeFilter.System}>Default</SelectItem>
            <SelectItem value={RoleTypeFilter.Custom}>Custom</SelectItem>
          </SelectContent>
        </Select>

        {(keyword || roleType !== RoleTypeFilter.All) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setKeyword("");
              setRoleType(RoleTypeFilter.All);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={loadFailed("roles")} onRetry={() => refetch()} />
        ) : filteredRoles.length === 0 ? (
          <EmptyState icon={Shield} title={notFound("roles")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>{TABLE_COLUMNS.source}</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">
                  {TABLE_COLUMNS.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role, index) => {
                const s = STATUS_VARIANT[role.status] ?? {
                  label: String(role.status),
                  variant: "outline" as const,
                };

                return (
                  <TableRow key={role.id}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {role.isSystemRole ? (
                            <Lock className="size-4" />
                          ) : (
                            <Shield className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{role.name}</p>
                          <p className="mt-0.5 max-w-130 truncate text-xs text-muted-foreground">
                            {role.description || role.normalizedName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.isSystemRole ? "secondary" : "outline"}
                      >
                        {role.isSystemRole ? "Default" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(role.createdAt)}
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
                            onClick={() => setDialog({ type: "edit", role })}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDialog({ type: "status", role })}
                          >
                            Change status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDialog({ type: "perms", role })}
                          >
                            Manage permissions
                          </DropdownMenuItem>
                          {!role.isSystemRole && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setDialog({ type: "delete", role })
                                }
                              >
                                Delete role
                              </DropdownMenuItem>
                            </>
                          )}
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

      <AlertDialog
        open={dialog.type === "delete"}
        onOpenChange={(open: boolean) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.type === "delete" && (
                <>
                  Are you sure you want to delete role{" "}
                  <strong>{dialog.role.name}</strong>? This action cannot be
                  undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
