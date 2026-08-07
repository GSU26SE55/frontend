import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminChangeAccountRole } from "@/features/admin/hooks/account/useAdminAccounts";
import { RoleStatusEnum } from "@/features/admin/enums/role.enum";
import type { RoleDto } from "@/features/admin/types/account/admin.types";
import type { AccountDto } from "@/shared/types/account/account.types";

interface Props {
  account: AccountDto;
  roles: RoleDto[];
}

/**
 * Đổi role ngay trong dropdown thao tác — 1 click, không mở modal.
 * Danh sách role fetch 1 lần ở page rồi truyền xuống, tránh mỗi hàng gọi lại API.
 */
export default function ChangeRoleSubmenu({ account, roles }: Props) {
  const { mutate, isPending } = useAdminChangeAccountRole();

  // Role Inactive/Deprecated không còn được gán mới — ẩn khỏi menu đổi nhanh.
  const assignable = roles.filter((r) => r.status === RoleStatusEnum.Active);

  // So khớp bằng roleId, không bằng name: name là chuỗi hiển thị, đổi tên role bên
  // trang Vai trò là dấu ✓ lệch ngay.
  const isCurrentRole = (role: RoleDto) => role.id === account.roleId;

  const handleChange = (role: RoleDto) => {
    // Đang giữ role đó rồi thì bấm cũng không đổi gì — bỏ qua để khỏi gọi API thừa.
    if (isCurrentRole(role)) return;

    // Toast/invalidate nằm trong useAdminChangeAccountRole — submenu đóng ngay khi bấm
    // nên component này unmount trước lúc response về, callback truyền ở đây sẽ mất.
    mutate({ id: account.id, payload: { roleId: role.id } });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {isPending ? "Đang đổi role…" : "Đổi role"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        {assignable.length === 0 ? (
          <DropdownMenuItem disabled>Không có role</DropdownMenuItem>
        ) : (
          assignable.map((r) => {
            const isCurrent = isCurrentRole(r);
            return (
              <DropdownMenuItem
                key={r.id}
                disabled={isPending || isCurrent}
                onClick={() => handleChange(r)}
              >
                <Check
                  className={`size-3.5 ${isCurrent ? "opacity-100" : "opacity-0"}`}
                />
                {r.name}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
