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

// useUrlFilters xoá key rỗng khỏi URL và TỰ đưa pageNumber về 1 mỗi khi đổi filter — nhờ vậy
// không rơi vào cảnh "đang ở trang 5, lọc còn 1 trang, bảng trống".
const DEFAULTS = {
  search: "",
  pageNumber: 1,
  pageSize: 10,
};

export default function NotificationGroupsPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // `null` = đóng; `{ target: null }` = mở để tạo mới; `{ target: g }` = sửa nhóm g.
  // Gói trong object để phân biệt "đang đóng" với "đang mở để tạo mới" — hai trạng thái này mà
  // cùng biểu diễn bằng null thì dialog tạo mới không bao giờ mở được.
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
            Thông báo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nhóm nhận thông báo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gom người nhận thành nhóm để gửi hàng loạt bằng một lệnh. Số người
            nhận hiển thị đã <b>loại</b> tài khoản ngừng hoạt động.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton queryKeys={[KEY.admin.notificationGroups]} />
          <Button onClick={() => setFormState({ target: null })}>
            <Plus className="mr-1 size-4" />
            Tạo nhóm
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Tìm theo tên nhóm…"
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
          // Remount khi đổi mục tiêu để defaultValues của form được tính lại.
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
            <AlertDialogTitle>Xoá nhóm này?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhóm <b>{deleteTarget?.name}</b> và{" "}
              <b>{deleteTarget?.memberCount} thành viên</b> sẽ bị xoá.{" "}
              <b>Lịch sử các lần đã gửi cho nhóm này vẫn được giữ nguyên</b> —
              xoá nhóm không làm những lần gửi đó biến mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Xoá nhóm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
