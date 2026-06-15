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
  BatteryChemistryEnum,
  type BatteryTypeDto,
} from "@/features/admin/types/battery-type.types";

const CHEMISTRY_LABEL: Record<BatteryChemistryEnum, string> = {
  [BatteryChemistryEnum.LI_FE_PO4]: "LiFePO4",
  [BatteryChemistryEnum.NMC]: "NMC",
  [BatteryChemistryEnum.NCA]: "NCA",
  [BatteryChemistryEnum.LCO]: "LCO",
  [BatteryChemistryEnum.OTHER]: "Khác",
};

interface BatteryTypeTableProps {
  data: BatteryTypeDto[];
  showRestore?: boolean;
  onEdit: (type: BatteryTypeDto) => void;
  onDelete: (type: BatteryTypeDto) => void;
  onRestore: (type: BatteryTypeDto) => void;
  onConfigThreshold: (type: BatteryTypeDto) => void;
}

export default function BatteryTypeTable({
  data,
  showRestore,
  onEdit,
  onDelete,
  onRestore,
  onConfigThreshold,
}: BatteryTypeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên model</TableHead>
          <TableHead>Nhà sản xuất</TableHead>
          <TableHead>Hóa học</TableHead>
          <TableHead className="text-right">Dung lượng (Ah)</TableHead>
          <TableHead className="text-right">Điện áp (V)</TableHead>
          <TableHead className="text-right">Chu kỳ</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((type) => (
          <TableRow key={type.id}>
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
            <TableCell className="text-right space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigThreshold(type)}
              >
                Ngưỡng
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(type)}>
                Sửa
              </Button>
              {showRestore ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(type)}
                >
                  Khôi phục
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(type)}
                >
                  Xoá
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
