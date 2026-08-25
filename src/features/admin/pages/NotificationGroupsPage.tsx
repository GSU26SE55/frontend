import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
import { DEFAULT_PAGE_SIZE } from "@/shared/constants/pagination";

// useUrlFilters strips empty keys from the URL and AUTOMATICALLY resets pageNumber to 1 whenever a
// filter changes — this avoids the case of "sitting on page 5, filter now has only 1 page, table empty".
const DEFAULTS = {
  search: "",
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
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
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Notifications
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification groups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : (data?.totalItems ?? 0)} groups &mdash; manage
            recipient groups.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.admin.notificationGroups]} />
          <Button size="sm" onClick={() => setFormState({ target: null })}>
            <Plus className="size-3.5" /> Create group
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by group name…"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setFilter("search", e.target.value);
          }}
          className="w-full sm:max-w-xs"
        />
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <NotificationGroupTable
          groups={groups}
          isLoading={isLoading}
          onEdit={(g) => setFormState({ target: g })}
          onDelete={setDeleteTarget}
          onMembers={setMembersTarget}
        />
      </Card>

      {data && data.totalItems > 0 && (
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
      )}

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
              variant="destructive"
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
    </PageContainer>
  );
}
