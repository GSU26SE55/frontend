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
 * Change the role right in the action dropdown — 1 click, no modal.
 * The role list is fetched once at the page level and passed down, avoiding a
 * repeated API call per row.
 */
export default function ChangeRoleSubmenu({ account, roles }: Props) {
  const { mutate, isPending } = useAdminChangeAccountRole();

  // Inactive/Deprecated roles can no longer be newly assigned — hide from the quick-change menu.
  const assignable = roles.filter((r) => r.status === RoleStatusEnum.Active);

  // Match by roleId, not name: name is just the display string — renaming a role on
  // the Roles page would immediately throw off the ✓ marker.
  const isCurrentRole = (role: RoleDto) => role.id === account.roleId;

  const handleChange = (role: RoleDto) => {
    // Already on that role — clicking changes nothing, so skip the redundant API call.
    if (isCurrentRole(role)) return;

    // Toast/invalidate lives in useAdminChangeAccountRole — the submenu closes as soon
    // as it's clicked, so this component unmounts before the response returns, and any
    // callback passed here would be lost.
    mutate({ id: account.id, payload: { roleId: role.id } });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {isPending ? "Changing role…" : "Change role"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        {assignable.length === 0 ? (
          <DropdownMenuItem disabled>No roles</DropdownMenuItem>
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
