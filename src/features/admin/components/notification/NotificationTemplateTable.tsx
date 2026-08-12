import { EllipsisVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";
import type { NotificationTemplateDto } from "@/features/admin/types/notification/notification-template.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  templates: NotificationTemplateDto[];
  isLoading: boolean;
  activatingId?: string | null;
  deletingId?: string | null;
  onPreview: (template: NotificationTemplateDto) => void;
  onActivate: (template: NotificationTemplateDto) => void;
  onEdit: (template: NotificationTemplateDto) => void;
  onDelete: (template: NotificationTemplateDto) => void;
}

export default function NotificationTemplateTable({
  templates,
  isLoading,
  activatingId,
  deletingId,
  onPreview,
  onActivate,
  onEdit,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No templates match the filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-3 py-2.5 font-medium">Channel</th>
            <th className="px-3 py-2.5 font-medium text-center">Version</th>
            <th className="px-3 py-2.5 font-medium">Title</th>
            <th className="px-3 py-2.5 font-medium">Updated</th>
            <th className="px-3 py-2.5 font-medium text-right">
              {TABLE_COLUMNS.actions}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {templates.map((t) => (
            <tr
              key={t.id}
              // Older versions are dimmed: the list mixes all versions together, and without this
              // distinction an admin could easily think they're editing the live version when it's
              // actually one that's been superseded.
              className={`hover:bg-muted/30 ${t.isActive ? "" : "text-muted-foreground"}`}
            >
              {/* BE returns a number; the English label is defined by FE (notificationLabels.ts). */}
              <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                {notificationTypeLabel(t.type)}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                {notificationChannelLabel(t.channel)}
              </td>
              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                <span className="tabular-nums">v{t.version}</span>
                {t.isActive && (
                  <Badge className="ml-2 text-[10px]">Active</Badge>
                )}
              </td>
              <td className="px-3 py-2.5 max-w-70">
                <span className="line-clamp-1" title={t.titleTemplate}>
                  {t.titleTemplate}
                </span>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                {format(
                  new Date(t.updatedAt ?? t.createdAt),
                  "MM/dd/yyyy HH:mm",
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-7" />
                    }
                  >
                    <EllipsisVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onPreview(t)}>
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(t)}>
                      Edit
                    </DropdownMenuItem>

                    {/* Only inactive versions have anything to activate (rolling back a version). */}
                    {!t.isActive && (
                      <DropdownMenuItem
                        disabled={activatingId === t.id}
                        onClick={() => onActivate(t)}
                      >
                        {activatingId === t.id ? "Activating…" : "Activate"}
                      </DropdownMenuItem>
                    )}

                    {/* The active version CANNOT be deleted — BE also blocks it (409). Hide the
                        button instead of letting it be clicked and error: losing the active version
                        would make the dispatcher silently fall back to a hardcoded string. */}
                    {!t.isActive && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={deletingId === t.id}
                          onClick={() => onDelete(t)}
                        >
                          {deletingId === t.id ? "Deleting…" : "Delete"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
