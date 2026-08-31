import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminChangeRoleStatus } from "@/features/admin/hooks/account/useAdminRoles";
import { RoleStatusEnum } from "@/features/admin/types/account/admin.types";
import type { RoleDto } from "@/features/admin/types/account/admin.types";

const STATUS_OPTIONS = [
  { value: RoleStatusEnum.Active, label: "Active" },
  { value: RoleStatusEnum.Inactive, label: "Off" },
  { value: RoleStatusEnum.Deprecated, label: "Deprecated" },
];

interface Props {
  role: RoleDto;
}

/**
 * Change the role status right in the action dropdown — 1 click, no modal.
 * Mirrors ChangeRoleSubmenu / ChangeAccountStatusSubmenu.
 */
export default function ChangeRoleStatusSubmenu({ role }: Props) {
  const { mutate, isPending } = useAdminChangeRoleStatus();

  const isCurrentStatus = (status: RoleStatusEnum) => status === role.status;

  const handleChange = (status: RoleStatusEnum) => {
    if (isCurrentStatus(status)) return;
    mutate({ id: role.id, payload: { status } });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {isPending ? "Changing status…" : "Change status"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40">
        {STATUS_OPTIONS.map((o) => {
          const isCurrent = isCurrentStatus(o.value);
          return (
            <DropdownMenuItem
              key={o.value}
              disabled={isPending || isCurrent}
              onClick={() => handleChange(o.value)}
            >
              <Check
                className={`size-3.5 ${isCurrent ? "opacity-100" : "opacity-0"}`}
              />
              {o.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
