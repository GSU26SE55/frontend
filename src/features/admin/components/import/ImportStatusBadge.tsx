import { Badge } from "@/components/ui/badge";
import {
  ImportBatchStatusEnum,
  ImportRowStatusEnum,
} from "@/shared/enums/import/import.enum";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const BATCH_LABEL: Record<ImportBatchStatusEnum, { text: string; variant: BadgeVariant }> = {
  [ImportBatchStatusEnum.Pending]: { text: "Chờ xử lý", variant: "secondary" },
  [ImportBatchStatusEnum.Parsing]: { text: "Đang đọc file", variant: "secondary" },
  [ImportBatchStatusEnum.Validating]: { text: "Đang kiểm định", variant: "secondary" },
  [ImportBatchStatusEnum.ValidationFailed]: { text: "File không dùng được", variant: "destructive" },
  [ImportBatchStatusEnum.ReadyToCommit]: { text: "Chờ ghi thật", variant: "outline" },
  [ImportBatchStatusEnum.Committing]: { text: "Đang ghi", variant: "secondary" },
  // Tách riêng khỏi "Đang ghi" có chủ ý: người vận hành cần phân biệt hệ thống đang bận với
  // việc đang chờ AuthService trả tài khoản về — hai tình huống xử lý khác hẳn nhau.
  [ImportBatchStatusEnum.AwaitingAccountSync]: { text: "Chờ cấp tài khoản", variant: "secondary" },
  [ImportBatchStatusEnum.Completed]: { text: "Hoàn tất", variant: "default" },
  [ImportBatchStatusEnum.CompletedWithErrors]: { text: "Xong, có dòng hỏng", variant: "outline" },
  [ImportBatchStatusEnum.Reverting]: { text: "Đang hoàn tác", variant: "secondary" },
  [ImportBatchStatusEnum.Reverted]: { text: "Đã hoàn tác", variant: "outline" },
  [ImportBatchStatusEnum.Failed]: { text: "Hỏng", variant: "destructive" },
};

const ROW_LABEL: Record<ImportRowStatusEnum, { text: string; variant: BadgeVariant }> = {
  [ImportRowStatusEnum.Pending]: { text: "Chờ", variant: "secondary" },
  [ImportRowStatusEnum.Valid]: { text: "Hợp lệ", variant: "outline" },
  [ImportRowStatusEnum.Invalid]: { text: "Không hợp lệ", variant: "destructive" },
  [ImportRowStatusEnum.AwaitingAccount]: { text: "Chờ tài khoản", variant: "secondary" },
  [ImportRowStatusEnum.Created]: { text: "Đã tạo", variant: "default" },
  [ImportRowStatusEnum.Updated]: { text: "Đã cập nhật", variant: "default" },
  [ImportRowStatusEnum.Skipped]: { text: "Bỏ qua", variant: "outline" },
  [ImportRowStatusEnum.Failed]: { text: "Ghi hỏng", variant: "destructive" },
  [ImportRowStatusEnum.Reverted]: { text: "Đã hoàn tác", variant: "outline" },
};

export function ImportBatchStatusBadge({ status }: { status: ImportBatchStatusEnum }) {
  const label = BATCH_LABEL[status];
  return <Badge variant={label.variant}>{label.text}</Badge>;
}

export function ImportRowStatusBadge({ status }: { status: ImportRowStatusEnum }) {
  const label = ROW_LABEL[status];
  return <Badge variant={label.variant}>{label.text}</Badge>;
}
