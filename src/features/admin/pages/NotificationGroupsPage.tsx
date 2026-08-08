import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import DataPagination from "@/shared/components/ui/DataPagination";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { KEY } from "@/shared/utils/queryKeys";
import {
  useNotificationGroups,
  useDeleteNotificationGroup,
} from "@/features/admin/hooks/notification/useNotificationGroups";
import NotificationGroupTable from "@/features/admin/components/notification/NotificationGroupTable";
import NotificationGroupFormDialog from "@/features/admin/components/notification/NotificationGroupFormDialog";
import NotificationGroupMembersDialog from "@/features/admin/components/notification/NotificationGroupMembersDialog";
import type { NotificationGroupDto } from "@/features/admin/types/notification/notification-group.types";

// useUrlFilters strips empty keys from the URL and AUTOMATICALLY resets pageNumber to 1 whenever a
// filter changes — this avoids the case of "sitting on page 5, filter now has only 1 page, table empty".
const DEFAULTS = {
  search: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function NotificationGroupsPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // `null` = closed; `{ target: null }` = open to create; `{ target: g }` = edit group g.
  // Wrapped in an object to distinguish "closed" from "open to create" — if both states were
  // represented by null, the create dialog could never open.
  const [formState, setFormState] = useState<{
    target: NotificationGroupDto | null;
  } | null>(null);
  const [membersTarget, setMembersTarget] =
    useState<NotificationGroupDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationGroupDto | null>(
    null,
  );

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    }),
    [debouncedSearch, filters.pageNumber, filters.pageSize],
  );

  const { data, isLoading } = useNotificationGroups(params);
  const remove = useDeleteNotificationGroup();

  const groups = data?.items ?? [];

  return (
    <div className="p-6 space-y-5 max-w-300 mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            <Users className="inline size-3 mr-1 -mt-0.5" />
            Notifications
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification groups
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Group recipients together to send in bulk with one command. The
            recipient count shown already <b>excludes</b> deactivated accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton queryKeys={[KEY.admin.notificationGroups]} />
          <Button onClick={() => setFormState({ target: null })}>
            <Plus className="mr-1 size-4" />
            Create group
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search by group name…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setFilter("search", e.target.value);
            }}
            className="h-9 max-w-xs"
          />
        </div>

        <NotificationGroupTable
          groups={groups}
          isLoading={isLoading}
          onEdit={(g) => setFormState({ target: g })}
          onDelete={setDeleteTarget}
          onMembers={setMembersTarget}
        />

        {data && data.totalItems > 0 && (
          <div className="border-t border-border p-3">
            <DataPagination
              pageNumber={data.pageNumber}
              pageSize={data.pageSize}
              totalItems={data.totalItems}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={(p) => setFilter("pageNumber", p)}
              onPageSizeChange={(s) => setFilter("pageSize", s)}
            />
          </div>
        )}
      </Card>

      {formState && (
        <NotificationGroupFormDialog
          // Remount when the target changes so the form's defaultValues are recalculated.
          key={formState.target?.id ?? "create"}
          open
          onOpenChange={(open) => !open && setFormState(null)}
          editTarget={formState.target}
        />
      )}

      {membersTarget && (
        <NotificationGroupMembersDialog
          key={membersTarget.id}
          open
          onOpenChange={(open) => !open && setMembersTarget(null)}
          group={membersTarget}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this group?</AlertDialogTitle>
            <AlertDialogDescription>
              Group <b>{deleteTarget?.name}</b> and its{" "}
              <b>{deleteTarget?.memberCount} members</b> will be deleted.{" "}
              <b>The history of sends made to this group is kept</b> — deleting
              the group does not remove those sends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
