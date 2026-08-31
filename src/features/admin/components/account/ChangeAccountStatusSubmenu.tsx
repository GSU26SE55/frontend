import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminChangeAccountStatusQuick } from "@/features/admin/hooks/account/useAdminAccounts";
import { AccountStatusEnum } from "@/shared/types/account/account.types";
import type { AccountDto } from "@/shared/types/account/account.types";

const STATUS_OPTIONS = [
  { value: AccountStatusEnum.Active, label: "Active" },
  { value: AccountStatusEnum.Inactive, label: "Inactive" },
  { value: AccountStatusEnum.Suspended, label: "Suspended" },
  { value: AccountStatusEnum.Banned, label: "Banned" },
];

interface Props {
  account: AccountDto;
}

/**
 * Change the account status right in the action dropdown — 1 click, no modal.
 * Mirrors ChangeRoleSubmenu. No "reason" field here — that stays in
 * ChangeAccountStatusDialog for cases where a reason is worth typing.
 */
export default function ChangeAccountStatusSubmenu({ account }: Props) {
  const { mutate, isPending } = useAdminChangeAccountStatusQuick();

  const isCurrentStatus = (status: AccountStatusEnum) =>
    status === account.status;

  const handleChange = (status: AccountStatusEnum) => {
    if (isCurrentStatus(status)) return;
    mutate({ id: account.id, payload: { status } });
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
