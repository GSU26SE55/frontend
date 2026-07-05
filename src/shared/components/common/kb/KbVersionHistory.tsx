import { useState } from "react";
import { format } from "date-fns";
import { History, GitCompare, Undo2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  KbVersionStatusEnum,
  KbVersionStatusLabel,
} from "@/shared/enums/kb.enum";
import type { KbArticleVersionDTO } from "@/shared/types/kb.types";

interface KbVersionHistoryProps {
  versions: KbArticleVersionDTO[];
  onCompare: (fromVersionId: string, toVersionId?: string) => void;
  onRollback?: (versionId: string) => void; // chỉ Manager/Admin
  onViewVersion?: (versionId: string) => void;
  isPending?: boolean;
}

export function KbVersionHistory({
  versions,
  onCompare,
  onRollback,
  onViewVersion,
  isPending,
}: KbVersionHistoryProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id].slice(-2),
    );
  };

  if (!versions.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có phiên bản nào.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4" />
          Lịch sử phiên bản
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={selected.length === 0 || isPending}
          onClick={() => onCompare(selected[0], selected[1])}
        >
          <GitCompare className="size-3.5" />
          So sánh {selected.length > 0 ? `(${selected.length})` : ""}
        </Button>
      </div>

      <div className="space-y-1.5">
        {versions.map((v) => {
          const isSel = selected.includes(v.id);
          return (
            <div
              key={v.id}
              className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                isSel ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => toggle(v.id)}
                className="size-4"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    v{v.majorVersion}.{v.minorVersion}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {KbVersionStatusLabel[v.status as KbVersionStatusEnum] ??
                      v.status}
                  </Badge>
                </div>
                {v.changeDescription && (
                  <p className="truncate text-xs text-muted-foreground">
                    {v.changeDescription}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {v.changedBy} ·{" "}
                  {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              {onViewVersion && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  title="Xem nội dung phiên bản này"
                  onClick={() => onViewVersion(v.id)}
                >
                  <Eye className="size-3.5" />
                </Button>
              )}
              {onRollback && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Hoàn tác về phiên bản này"
                        disabled={isPending}
                      />
                    }
                  >
                    <Undo2 className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Hoàn tác về v{v.majorVersion}.{v.minorVersion}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Nội dung bài viết sẽ được khôi phục về phiên bản này và
                        tạo một phiên bản mới. Bạn có chắc chắn?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Huỷ</AlertDialogCancel>
                      <AlertDialogCancel
                        variant="default"
                        onClick={() => onRollback(v.id)}
                      >
                        Hoàn tác
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
