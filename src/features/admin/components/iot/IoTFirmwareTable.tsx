import { useState } from "react";
import { toast } from "sonner";
import { EllipsisVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmActionDialog from "@/features/admin/components/common/ConfirmActionDialog";
import {
  usePublishFirmwareRelease,
  useArchiveFirmwareRelease,
} from "@/features/admin/hooks/iot/useIotFirmwareMutations";
import { handleErrorApi } from "@/shared/lib/errors";
import { IotFirmwareChannelEnum } from "@/shared/enums/iot/iot.enum";
import type { IotFirmwareReleaseDto } from "@/shared/types/iot/iot.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { formatDate } from "@/shared/utils/datetime";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  items: IotFirmwareReleaseDto[];
  /** Sort server-side — state from useUrlSort. */
  sort: ServerSortState;
}

type PendingAction = { id: string; kind: "publish" | "archive" } | null;

export default function IoTFirmwareTable({ items, sort }: Props) {
  const { mutate: publish } = usePublishFirmwareRelease();
  const { mutate: archive } = useArchiveFirmwareRelease();
  const [pending, setPending] = useState<PendingAction>(null);
  // BE already sorted the whole dataset (SortBy/SortDir) → render items as-is.
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  const runAction = () => {
    if (!pending) return;
    const opts = {
      onSuccess: () =>
        toast.success(pending.kind === "publish" ? "Published" : "Archived"),
      onError: (error: unknown) => handleErrorApi({ error }),
    };
    if (pending.kind === "publish") publish(pending.id, opts);
    else archive(pending.id, opts);
    setPending(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              sortKey="version"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Version
            </SortableTableHead>
            <SortableTableHead
              sortKey="hardwareRevision"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Hardware Rev
            </SortableTableHead>
            <SortableTableHead
              sortKey="channel"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Channel
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Status
            </SortableTableHead>
            <SortableTableHead
              sortKey="artifactSizeBytes"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Size
            </SortableTableHead>
            <SortableTableHead
              sortKey="createdAt"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={toggleSort}
            >
              Created
            </SortableTableHead>
            <TableHead className="text-right">
              {TABLE_COLUMNS.actions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">
                {item.version}
                {item.isRequired && (
                  <Badge variant="destructive" className="ml-2">
                    Required
                  </Badge>
                )}
              </TableCell>
              <TableCell>{item.hardwareRevision}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.channel === IotFirmwareChannelEnum.Beta
                      ? "outline"
                      : "secondary"
                  }
                >
                  {item.channel === IotFirmwareChannelEnum.Beta
                    ? "Beta"
                    : "Stable"}
                </Badge>
              </TableCell>
              <TableCell>
                {item.isArchived ? (
                  <Badge variant="destructive">Archived</Badge>
                ) : item.isPublished ? (
                  <Badge variant="default">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {formatBytes(item.artifactSizeBytes)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(item.createdAt)}
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
                    {!item.isPublished && !item.isArchived && (
                      <DropdownMenuItem
                        onClick={() =>
                          setPending({ id: item.id, kind: "publish" })
                        }
                      >
                        Publish
                      </DropdownMenuItem>
                    )}
                    {!item.isArchived && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          setPending({ id: item.id, kind: "archive" })
                        }
                      >
                        Archive
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No firmware releases yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmActionDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={
          pending?.kind === "publish" ? "Publish release?" : "Archive release?"
        }
        description={
          pending?.kind === "publish"
            ? "The release will become available to set as the OTA target for devices."
            : "The release can no longer be set as a target (rollback/EOL)."
        }
        actionLabel={pending?.kind === "publish" ? "Publish" : "Archive"}
        destructive={pending?.kind === "archive"}
        onConfirm={runAction}
      />
    </>
  );
}
