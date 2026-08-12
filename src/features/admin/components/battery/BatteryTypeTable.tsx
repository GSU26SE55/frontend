import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BatteryChemistryEnum,
  type BatteryTypeDto,
} from "@/features/admin/types/battery/battery-type.types";
import { DataTable, type ColumnDef } from "@/shared/components/ui/DataTable";
import type { ServerSortState } from "@/shared/hooks/useServerSort";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";
import { ACTIONS } from "@/shared/constants/actions";

const CHEMISTRY_LABEL: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LI_FE_PO4]: "LiFePO4",
  [BatteryChemistryEnum.NMC]: "NMC",
  [BatteryChemistryEnum.NCA]: "NCA",
  [BatteryChemistryEnum.LCO]: "LCO",
  [BatteryChemistryEnum.OTHER]: "Other",
};

interface BatteryTypeTableProps {
  data: BatteryTypeDto[];
  pageNumber: number;
  pageSize: number;
  showRestore?: boolean;
  onEdit: (type: BatteryTypeDto) => void;
  onDelete: (type: BatteryTypeDto) => void;
  onRestore: (type: BatteryTypeDto) => void;
  onConfigThreshold: (type: BatteryTypeDto) => void;
  /** Server-side sort — state from useUrlSort. */
  sort: ServerSortState;
}

export default function BatteryTypeTable({
  data,
  pageNumber,
  pageSize,
  showRestore,
  onEdit,
  onDelete,
  onRestore,
  onConfigThreshold,
  sort,
}: BatteryTypeTableProps) {
  const columns: ColumnDef<BatteryTypeDto>[] = [
    {
      id: "name",
      header: "Model name",
      sortKey: "name",
      sortValue: (t) => t.name,
      cellClassName: "font-medium",
      cell: (t) => t.name,
    },
    {
      id: "manufacturer",
      header: "Manufacturer",
      sortKey: "manufacturer",
      sortValue: (t) => t.manufacturer ?? "",
      cell: (t) => t.manufacturer ?? "—",
    },
    {
      id: "chemistry",
      header: "Chemistry",
      sortKey: "chemistry",
      sortValue: (t) => CHEMISTRY_LABEL[t.chemistry] ?? "",
      cell: (t) => (
        <Badge variant="secondary">{CHEMISTRY_LABEL[t.chemistry] ?? "—"}</Badge>
      ),
    },
    {
      id: "nominalCapacityAh",
      header: "Capacity (Ah)",
      sortKey: "nominalCapacityAh",
      sortValue: (t) => t.nominalCapacityAh,
      headClassName: "justify-end text-right",
      cellClassName: "text-right tabular-nums",
      cell: (t) => t.nominalCapacityAh,
    },
    {
      id: "nominalVoltage",
      header: "Voltage (V)",
      sortKey: "nominalVoltage",
      sortValue: (t) => t.nominalVoltage,
      headClassName: "justify-end text-right",
      cellClassName: "text-right tabular-nums",
      cell: (t) => t.nominalVoltage,
    },
    {
      id: "maxCycleCount",
      header: "Cycles",
      sortKey: "maxCycleCount",
      sortValue: (t) => t.maxCycleCount,
      headClassName: "justify-end text-right",
      cellClassName: "text-right tabular-nums",
      cell: (t) => t.maxCycleCount,
    },
    {
      id: "actions",
      header: TABLE_COLUMNS.actions,
      headClassName: "text-right",
      cellClassName: "text-right",
      cell: (type) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-7" />}
          >
            <EllipsisVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {showRestore ? (
              <DropdownMenuItem onClick={() => onRestore(type)}>
                Restore
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => onConfigThreshold(type)}>
                  Configure thresholds
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(type)}>
                  {ACTIONS.EDIT}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(type)}
                >
                  {ACTIONS.DELETE}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(t) => t.id}
      showIndex
      pageNumber={pageNumber}
      pageSize={pageSize}
      serverSort={sort}
    />
  );
}
