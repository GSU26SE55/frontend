import { useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DataPagination from "@/shared/components/ui/DataPagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAdminAccountList } from "@/features/admin/hooks/account/useAdminAccounts";
import {
  useNotificationGroupMembers,
  useAddGroupMembers,
  useRemoveGroupMember,
} from "@/features/admin/hooks/notification/useNotificationGroups";
import {
  NotificationGroupKindEnum,
  type NotificationGroupDto,
} from "@/features/admin/types/notification/notification-group.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: NotificationGroupDto;
}

const PAGE_SIZE = 10;

export default function NotificationGroupMembersDialog({
  open,
  onOpenChange,
  group,
}: Props) {
  const isRoleGroup = group.kind === NotificationGroupKindEnum.Role;

  const [page, setPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedMemberSearch = useDebounce(memberSearch, 300);

  const [pickerSearch, setPickerSearch] = useState("");
  const debouncedPickerSearch = useDebounce(pickerSearch, 300);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useNotificationGroupMembers(
    open ? group.id : undefined,
    {
      search: debouncedMemberSearch || undefined,
      pageNumber: page,
      pageSize: PAGE_SIZE,
    },
  );

  // Ô chọn người: tìm kiếm PHÍA SERVER. Cố ý không lấy `pageSize: 100` rồi lọc ở client như một
  // số dropdown cũ trong repo — quá 100 tài khoản là âm thầm mất người, không có gì báo.
  const { data: accountList, isFetching: isSearchingAccounts } =
    useAdminAccountList({
      pageSize: 20,
      keyword: debouncedPickerSearch || undefined,
    });

  const addMembers = useAddGroupMembers();
  const removeMember = useRemoveGroupMember();

  const memberIds = new Set((data?.items ?? []).map((m) => m.userId));
  const candidates = (accountList?.items ?? []).filter(
    (a) => !memberIds.has(a.id),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAdd = async () => {
    if (selected.length === 0) return;
    await addMembers.mutateAsync({
      id: group.id,
      payload: { userIds: selected },
    });
    setSelected([]);
    setPickerSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Thành viên: {group.name}</DialogTitle>
          <DialogDescription>
            {isRoleGroup ? (
              <>
                Nhóm <b>theo vai trò</b> — thành viên tự suy ra từ tài khoản có
                vai trò <b>{group.roleFilter}</b>, không thêm/bớt tay được. Cấp
                hoặc thu vai trò cho tài khoản ở màn hình Tài khoản.
              </>
            ) : (
              <>
                Người có tài khoản đang ngừng hoạt động vẫn nằm trong danh sách
                nhưng <b>không nhận được thông báo</b> — hiển thị mờ để bạn dọn.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isRoleGroup && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">Thêm người vào nhóm</p>
            <Input
              placeholder="Tìm theo tên hoặc email…"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="h-8"
            />
            <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background">
              {isSearchingAccounts ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Đang tìm…
                </p>
              ) : candidates.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  {pickerSearch
                    ? "Không tìm thấy tài khoản nào chưa ở trong nhóm."
                    : "Gõ để tìm tài khoản."}
                </p>
              ) : (
                candidates.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted ${
                      selected.includes(a.id) ? "bg-muted" : ""
                    }`}
                  >
                    <span>
                      {a.fullName}{" "}
                      <span className="text-muted-foreground">— {a.email}</span>
                    </span>
                    {selected.includes(a.id) && (
                      <Badge variant="secondary" className="text-[10px]">
                        đã chọn
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Đã chọn {selected.length} người
              </span>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={selected.length === 0 || addMembers.isPending}
              >
                {addMembers.isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <UserPlus className="mr-1 size-3.5" />
                )}
                Thêm vào nhóm
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Input
            placeholder="Lọc trong danh sách thành viên…"
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setPage(1);
            }}
            className="h-8"
          />

          <div className="rounded-lg border border-border">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Đang tải…
              </p>
            ) : (data?.items.length ?? 0) === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nhóm chưa có thành viên nào.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {data!.items.map((m) => (
                  <li
                    key={m.userId}
                    className={`flex items-center justify-between px-3 py-2 text-xs ${
                      m.isActive ? "" : "opacity-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.fullName}{" "}
                        <span className="font-normal text-muted-foreground">
                          — {m.email}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.role}
                        {!m.isActive && " · tài khoản đang ngừng hoạt động"}
                      </p>
                    </div>
                    {!isRoleGroup && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={removeMember.isPending}
                        onClick={() =>
                          removeMember.mutate({
                            id: group.id,
                            userId: m.userId,
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data && data.totalItems > PAGE_SIZE && (
            <DataPagination
              pageNumber={data.pageNumber}
              pageSize={data.pageSize}
              totalItems={data.totalItems}
              totalPages={data.totalPages}
              hasNextPage={data.hasNextPage}
              hasPreviousPage={data.hasPreviousPage}
              onPageChange={setPage}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
