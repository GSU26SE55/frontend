import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KbVersionHistory } from "./KbVersionHistory";
import { KbDiffViewer } from "./KbDiffViewer";
import type {
  KbArticleVersionDTO,
  KbArticleDiffDTO,
} from "@/shared/types/kb.types";

interface KbVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: KbArticleVersionDTO[];
  diff?: KbArticleDiffDTO | null;
  onCompare: (fromVersionId: string, toVersionId?: string) => void;
  onRollback?: (versionId: string) => void;
  isPending?: boolean;
}

export function KbVersionDialog({
  open,
  onOpenChange,
  versions,
  diff,
  onCompare,
  onRollback,
  isPending,
}: KbVersionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử phiên bản</DialogTitle>
        </DialogHeader>
        <KbVersionHistory
          versions={versions}
          onCompare={onCompare}
          onRollback={onRollback}
          isPending={isPending}
        />
        {diff && (
          <div className="mt-2 border-t border-border pt-4">
            <KbDiffViewer diff={diff} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
