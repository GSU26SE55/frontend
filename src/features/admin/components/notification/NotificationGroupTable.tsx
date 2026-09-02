import { Lock, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        Loading…
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No groups match the filter.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group name</TableHead>
          <TableHead className="w-40">Member selection</TableHead>
          <TableHead className="w-32 text-right">Recipients</TableHead>
          <TableHead className="w-44 text-right">Actions</TableHead>
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
                    <Badge variant="secondary" className="gap-1 text-3xs">
                      <Lock className="size-2.5" />
                      system
                    </Badge>
                  )}
                </div>
                {g.description && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" />
                      }
                    >
                      {g.description}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      {g.description}
                    </TooltipContent>
                  </Tooltip>
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
                  members
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMembers(g)}
                    title={isRole ? "View members" : "Manage members"}
                  >
                    <Users className="size-3.5" />
                  </Button>
                  {/* System groups: BE returns 409 if you try to edit/delete them. Hide the button
                      so users aren't invited to click something guaranteed to fail. */}
                  {!g.isSystem && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(g)}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(g)}
                        title="Delete"
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
