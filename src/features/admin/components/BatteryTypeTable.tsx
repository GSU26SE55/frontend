import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  BatteryChemistryEnum,
  type BatteryTypeDto,
} from "@/features/admin/types/battery-type.types";
import { SortableTableHead } from "@/shared/components/ui/SortableTableHead";
import { useSortableData } from "@/shared/hooks/useSortableData";

const CHEMISTRY_LABEL: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LI_FE_PO4]: "LiFePO4",
  [BatteryChemistryEnum.NMC]: "NMC",
  [BatteryChemistryEnum.NCA]: "NCA",
  [BatteryChemistryEnum.LCO]: "LCO",
  [BatteryChemistryEnum.OTHER]: "Khác",
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
}: BatteryTypeTableProps) {
  const { sorted, sortKey, sortDirection, toggleSort } =
    useSortableData<BatteryTypeDto>(data, (type, key) => {
      switch (key) {
        case "name":
          return type.name;
        case "manufacturer":
          return type.manufacturer ?? "";
        case "chemistry":
          return CHEMISTRY_LABEL[type.chemistry] ?? "";
        case "nominalCapacityAh":
          return type.nominalCapacityAh;
        case "nominalVoltage":
          return type.nominalVoltage;
        case "maxCycleCount":
          return type.maxCycleCount;
        default:
          return null;
      }
    });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 text-center">STT</TableHead>
          <SortableTableHead
            sortKey="name"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Tên model
          </SortableTableHead>
          <SortableTableHead
            sortKey="manufacturer"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Nhà sản xuất
          </SortableTableHead>
          <SortableTableHead
            sortKey="chemistry"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          >
            Hóa học
          </SortableTableHead>
          <SortableTableHead
            sortKey="nominalCapacityAh"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="justify-end text-right"
          >
            Dung lượng (Ah)
          </SortableTableHead>
          <SortableTableHead
            sortKey="nominalVoltage"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="justify-end text-right"
          >
            Điện áp (V)
          </SortableTableHead>
          <SortableTableHead
            sortKey="maxCycleCount"
            activeSortKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
            className="justify-end text-right"
          >
            Chu kỳ
          </SortableTableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((type, index) => (
          <TableRow key={type.id}>
            <TableCell className="text-center text-muted-foreground tabular-nums">
              {(pageNumber - 1) * pageSize + index + 1}
            </TableCell>
            <TableCell className="font-medium">{type.name}</TableCell>
            <TableCell>{type.manufacturer ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {CHEMISTRY_LABEL[type.chemistry] ?? "—"}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {type.nominalCapacityAh}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {type.nominalVoltage}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {type.maxCycleCount}
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
                <DropdownMenuContent align="end" className="w-48">
                  {showRestore ? (
                    <DropdownMenuItem onClick={() => onRestore(type)}>
                      Khôi phục
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => onConfigThreshold(type)}>
                        Cấu hình ngưỡng
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(type)}>
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(type)}
                      >
                        Xoá
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
