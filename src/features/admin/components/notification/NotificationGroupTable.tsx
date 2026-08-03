import { Lock, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notificationGroupKindLabel } from "@/shared/constants/notificationLabels";
import {
  NotificationGroupKindEnum,
  type NotificationGroupDto,
} from "@/features/admin/types/notification/notification-group.types";

interface Props {
  groups: NotificationGroupDto[];
  isLoading: boolean;
  onEdit: (group: NotificationGroupDto) => void;
  onDelete: (group: NotificationGroupDto) => void;
  onMembers: (group: NotificationGroupDto) => void;
}

export default function NotificationGroupTable({
  groups,
  isLoading,
  onEdit,
  onDelete,
  onMembers,
}: Props) {
  if (isLoading) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Đang tải…
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Chưa có nhóm nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên nhóm</TableHead>
          <TableHead className="w-40">Cách chọn thành viên</TableHead>
          <TableHead className="w-32 text-right">Người nhận</TableHead>
          <TableHead className="w-44 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((g) => {
          const isRole = g.kind === NotificationGroupKindEnum.Role;
          return (
            <TableRow key={g.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{g.name}</span>
                  {g.isSystem && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Lock className="size-2.5" />
                      hệ thống
                    </Badge>
                  )}
                </div>
                {g.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {g.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs">
                  {notificationGroupKindLabel(g.kind)}
                  {isRole && g.roleFilter && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {g.roleFilter}
                    </span>
                  )}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-medium tabular-nums">
                  {g.memberCount}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  người
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMembers(g)}
                    title={isRole ? "Xem thành viên" : "Quản lý thành viên"}
                  >
                    <Users className="size-3.5" />
                  </Button>
                  {/* Nhóm hệ thống: BE trả 409 nếu cố sửa/xoá. Ẩn nút để không mời người dùng
                      bấm vào thứ chắc chắn thất bại. */}
                  {!g.isSystem && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(g)}
                        title="Sửa"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(g)}
                        title="Xoá"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
