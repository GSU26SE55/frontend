import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { KbVersionHistory } from "./KbVersionHistory";
import { KbDiffViewer } from "./KbDiffViewer";
import type {
  KbArticleVersionDTO,
  KbArticleDiffDTO,
} from "@/shared/types/kb/kb.types";

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
      <DialogContent className="!w-[94vw] !max-w-[94vw] p-0 overflow-hidden">
        {/* ── Side-by-side layout: inner div owns the height ─── */}
        <div className="flex flex-col" style={{ height: "88vh" }}>
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 shrink-0">
            <DialogTitle className="text-base font-semibold">
              Version history
            </DialogTitle>
          </div>
          {/* Body: left list + right diff */}
          <div className="flex flex-1 min-h-0">
            <div className="w-75 shrink-0 border-r border-border overflow-y-auto px-4 py-4">
              <KbVersionHistory
                versions={versions}
                onCompare={onCompare}
                onRollback={onRollback}
                isPending={isPending}
              />
            </div>
            <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4">
              {diff ? (
                <KbDiffViewer diff={diff} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select 2 versions then click Compare
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
