import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KbVersionHistory } from "./KbVersionHistory";
import { KbDiffViewer } from "./KbDiffViewer";
import {
  KbVersionStatusEnum,
  KbVersionStatusLabel,
} from "@/shared/enums/kb.enum";
import type {
  KbArticleVersionDTO,
  KbArticleDiffDTO,
} from "@/shared/types/kb.types";

interface KbVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: KbArticleVersionDTO[];
  diff?: KbArticleDiffDTO | null;
  versionDetail?: KbArticleVersionDTO | null;
  onCompare: (fromVersionId: string, toVersionId?: string) => void;
  onViewVersion?: (versionId: string) => void;
  onRollback?: (versionId: string) => void;
  isPending?: boolean;
}

export function KbVersionDialog({
  open,
  onOpenChange,
  versions,
  diff,
  versionDetail,
  onCompare,
  onViewVersion,
  onRollback,
  isPending,
}: KbVersionDialogProps) {
  const [showingDetail, setShowingDetail] = useState(false);

  const handleViewVersion = (versionId: string) => {
    setShowingDetail(true);
    onViewVersion?.(versionId);
  };

  const handleBack = () => {
    setShowingDetail(false);
    onViewVersion?.("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setShowingDetail(false);
    onOpenChange(next);
  };

  const hasSideBySide = !showingDetail;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          hasSideBySide
            ? "!w-[94vw] !max-w-[94vw] p-0 overflow-hidden"
            : showingDetail && versionDetail
            ? "max-w-3xl max-h-[85vh] overflow-y-auto"
            : "max-w-2xl max-h-[80vh] overflow-y-auto"
        }
      >
        {hasSideBySide ? (
          /* ── Side-by-side layout: inner div owns the height ── */
          <div className="flex flex-col" style={{ height: "88vh" }}>
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-3 shrink-0">
              <DialogTitle className="text-base font-semibold">
                Lịch sử phiên bản
              </DialogTitle>
            </div>
            {/* Body: left list + right diff */}
            <div className="flex flex-1 min-h-0">
              <div className="w-[300px] shrink-0 border-r border-border overflow-y-auto px-4 py-4">
                <KbVersionHistory
                  versions={versions}
                  onCompare={onCompare}
                  onRollback={onRollback}
                  onViewVersion={onViewVersion ? handleViewVersion : undefined}
                  isPending={isPending}
                />
              </div>
              <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4">
                {diff ? (
                  <KbDiffViewer diff={diff} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Chọn 2 phiên bản rồi bấm So sánh
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Normal stacked layout ── */
          <div className="px-6 py-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {showingDetail && versionDetail && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 -ml-1"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="size-3.5" />
                  </Button>
                )}
                {showingDetail && versionDetail
                  ? `Nội dung v${versionDetail.majorVersion}.${versionDetail.minorVersion}`
                  : "Lịch sử phiên bản"}
              </DialogTitle>
            </DialogHeader>

            {showingDetail && versionDetail ? (
              <VersionContentView version={versionDetail} />
            ) : (
              <KbVersionHistory
                versions={versions}
                onCompare={onCompare}
                onRollback={onRollback}
                onViewVersion={onViewVersion ? handleViewVersion : undefined}
                isPending={isPending}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inline version content viewer ────────────────────────────────────────────
function VersionContentView({ version }: { version: KbArticleVersionDTO }) {
  const fields = [
    { label: "Triệu chứng", value: version.symptoms },
    { label: "Bước chẩn đoán", value: version.diagnosisSteps },
    { label: "Hướng giải quyết", value: version.solutionSteps },
    {
      label: "Linh kiện khuyến nghị",
      value: (version.recommendedParts ?? []).join("\n") || null,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[11px]">
          {KbVersionStatusLabel[version.status as KbVersionStatusEnum] ??
            version.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {version.changedBy} ·{" "}
          {format(new Date(version.createdAt), "dd/MM/yyyy HH:mm")}
        </span>
        {version.changeDescription && (
          <span className="text-xs text-muted-foreground italic">
            — {version.changeDescription}
          </span>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {fields.map((f, idx) => {
          if (!f.value?.trim()) return null;
          return (
            <div key={f.label}>
              {idx > 0 && <Separator />}
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {f.label}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {f.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
