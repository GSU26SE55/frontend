import { EllipsisVertical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationGroupKindLabel } from "@/shared/constants/notificationLabels";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group name</TableHead>
            <TableHead className="w-40">Member selection</TableHead>
            <TableHead className="w-32 text-right">Recipients</TableHead>
            <TableHead className="w-16 text-right">
              {TABLE_COLUMNS.actions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-10 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-6 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          <TableHead className="w-16 text-right">
            {TABLE_COLUMNS.actions}
          </TableHead>
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-7" />
                    }
                    aria-label="Actions"
                  >
                    <EllipsisVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {/* System groups: BE returns 409 if you try to edit/delete them. Hide the
                        items so users aren't invited to click something guaranteed to fail. */}
                    {!g.isSystem && (
                      <DropdownMenuItem onClick={() => onEdit(g)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onMembers(g)}>
                      {isRole ? "View members" : "Manage members"}
                    </DropdownMenuItem>
                    {!g.isSystem && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(g)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
