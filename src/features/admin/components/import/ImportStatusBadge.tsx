import { Badge } from "@/components/ui/badge";
import {
  ImportBatchStatusEnum,
  ImportRowStatusEnum,
} from "@/shared/enums/import/import.enum";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const BATCH_LABEL: Record<
  ImportBatchStatusEnum,
  { text: string; variant: BadgeVariant }
> = {
  [ImportBatchStatusEnum.Pending]: { text: "Pending", variant: "secondary" },
  [ImportBatchStatusEnum.Parsing]: {
    text: "Parsing file",
    variant: "secondary",
  },
  [ImportBatchStatusEnum.Validating]: {
    text: "Validating",
    variant: "secondary",
  },
  [ImportBatchStatusEnum.ValidationFailed]: {
    text: "File unusable",
    variant: "destructive",
  },
  [ImportBatchStatusEnum.ReadyToCommit]: {
    text: "Ready to commit",
    variant: "outline",
  },
  [ImportBatchStatusEnum.Committing]: { text: "Writing", variant: "secondary" },
  // Deliberately kept apart from "Writing": the operator needs to tell a busy system from one
  // waiting on AuthService to hand accounts back — the two call for different responses.
  [ImportBatchStatusEnum.AwaitingAccountSync]: {
    text: "Awaiting accounts",
    variant: "secondary",
  },
  [ImportBatchStatusEnum.Completed]: { text: "Completed", variant: "default" },
  [ImportBatchStatusEnum.CompletedWithErrors]: {
    text: "Completed with errors",
    variant: "outline",
  },
  [ImportBatchStatusEnum.Reverting]: {
    text: "Reverting",
    variant: "secondary",
  },
  [ImportBatchStatusEnum.Reverted]: { text: "Reverted", variant: "outline" },
  [ImportBatchStatusEnum.Failed]: { text: "Failed", variant: "destructive" },
};

const ROW_LABEL: Record<
  ImportRowStatusEnum,
  { text: string; variant: BadgeVariant }
> = {
  [ImportRowStatusEnum.Pending]: { text: "Pending", variant: "secondary" },
  [ImportRowStatusEnum.Valid]: { text: "Valid", variant: "outline" },
  [ImportRowStatusEnum.Invalid]: { text: "Invalid", variant: "destructive" },
  [ImportRowStatusEnum.AwaitingAccount]: {
    text: "Awaiting account",
    variant: "secondary",
  },
  [ImportRowStatusEnum.Created]: { text: "Created", variant: "default" },
  [ImportRowStatusEnum.Updated]: { text: "Updated", variant: "default" },
  [ImportRowStatusEnum.Skipped]: { text: "Skipped", variant: "outline" },
  [ImportRowStatusEnum.Failed]: {
    text: "Write failed",
    variant: "destructive",
  },
  [ImportRowStatusEnum.Reverted]: { text: "Reverted", variant: "outline" },
};

export function ImportBatchStatusBadge({
  status,
}: {
  status: ImportBatchStatusEnum;
}) {
  const label = BATCH_LABEL[status];
  return <Badge variant={label.variant}>{label.text}</Badge>;
}

export function ImportRowStatusBadge({
  status,
}: {
  status: ImportRowStatusEnum;
}) {
  const label = ROW_LABEL[status];
  return <Badge variant={label.variant}>{label.text}</Badge>;
}
