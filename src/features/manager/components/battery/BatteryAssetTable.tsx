import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toneClass, BATTERY_STATUS_TONE } from "@/shared/theme/statusColors";
import {
  BatteryStatusEnum,
  type BatteryAssetDto,
} from "@/features/manager/types/battery/battery-asset.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

const statusLabel: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Inactive",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

interface BatteryAssetTableProps {
  items: BatteryAssetDto[];
  pageNumber: number;
  pageSize: number;
  sort: ServerSortState;
}

// Manager — read-only table (no CRUD). Click a row → real-time detail.
export default function BatteryAssetTable({
  items,
  pageNumber,
  pageSize,
  sort,
}: BatteryAssetTableProps) {
  const navigate = useNavigate();
  const sortKey = sort.sortBy;
  const sortDirection = sort.sortDir;
  const toggleSort = sort.toggleSort;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">
            {TABLE_COLUMNS.index}
          </TableHead>
          <SortableTableHead
            sortKey="serialNumber"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Serial Number
          </SortableTableHead>
          <SortableTableHead
            sortKey="batteryTypeName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Battery type
          </SortableTableHead>
          <SortableTableHead
            sortKey="customerName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Customer
          </SortableTableHead>
          <SortableTableHead
            sortKey="siteName"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Site
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
            sortKey="installDate"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Install date
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow
            key={item.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/manager/battery-assets/${item.id}`)}
          >
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {item.serialNumber}
            </TableCell>
            <TableCell>{item.batteryTypeName}</TableCell>
            <TableCell>{item.customerName}</TableCell>
            <TableCell>{item.siteName ?? "—"}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={toneClass(
                  BATTERY_STATUS_TONE[item.status] ?? "muted",
                )}
              >
                {statusLabel[item.status]}
              </Badge>
            </TableCell>
            <TableCell>{item.installDate.slice(0, 10)}</TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground py-8"
            >
              No data
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
