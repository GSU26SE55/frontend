import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { format } from "date-fns";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";
import { renderWithSamples } from "@/features/admin/utils/handlebars";
import { getVariableDoc } from "@/features/admin/constants/templateVariableDocs";
import type { NotificationTemplateDto } from "@/features/admin/types/notification/notification-template.types";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

interface Props {
  templates: NotificationTemplateDto[];
  isLoading: boolean;
  pageNumber: number;
  pageSize: number;
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
  pageNumber,
  pageSize,
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">
            {TABLE_COLUMNS.index}
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead className="text-center">Version</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">{TABLE_COLUMNS.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((t, index) => (
          <TableRow
            key={t.id}
            // Older versions are dimmed: the list mixes all versions together, and without this
            // distinction an admin could easily think they're editing the live version when it's
            // actually one that's been superseded.
            className={t.isActive ? "" : "text-muted-foreground"}
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            {/* BE returns a number; the English label is defined by FE (notificationLabels.ts). */}
            <TableCell className="font-medium">
              {notificationTypeLabel(t.type)}
            </TableCell>
            <TableCell>{notificationChannelLabel(t.channel)}</TableCell>
            <TableCell className="text-center tabular-nums">
              v{t.version}
            </TableCell>
            <TableCell className="max-w-70 whitespace-normal">
              {/* Shows the sentence with variables replaced by sample values. This column used to
                    print the raw `Ticket {{code}} has been resolved` — an operator could not see how
                    the sentence actually reads when sent, which is the very thing they come here to
                    check. `title` keeps the raw template for anyone who needs the variable names. */}
              <span className="line-clamp-1" title={t.titleTemplate}>
                {renderWithSamples(
                  t.titleTemplate,
                  (n) => getVariableDoc(n)?.sample,
                )}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {format(new Date(t.updatedAt ?? t.createdAt), "MM/dd/yyyy HH:mm")}
            </TableCell>
            <TableCell className="text-right">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
