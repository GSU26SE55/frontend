import { useState } from "react";
import { format } from "date-fns";
import { History, GitCompare, Undo2 } from "lucide-react";
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
} from "@/shared/enums/kb/kb.enum";
import type { KbArticleVersionDTO } from "@/shared/types/kb/kb.types";
import { ACTIONS } from "@/shared/constants/actions";

interface KbVersionHistoryProps {
  versions: KbArticleVersionDTO[];
  onCompare: (fromVersionId: string, toVersionId?: string) => void;
  onRollback?: (versionId: string) => void; // Manager/Admin only
  isPending?: boolean;
}

export function KbVersionHistory({
  versions,
  onCompare,
  onRollback,
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
        No versions yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4" />
          Version history
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={selected.length === 0 || isPending}
          onClick={() => onCompare(selected[0], selected[1])}
        >
          <GitCompare className="size-3.5" />
          Compare {selected.length > 0 ? `(${selected.length})` : ""}
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
                  <Badge variant="secondary" className="text-3xs">
                    {KbVersionStatusLabel[v.status as KbVersionStatusEnum] ??
                      v.status}
                  </Badge>
                </div>
                {v.changeDescription && (
                  <p className="truncate text-xs text-muted-foreground">
                    {v.changeDescription}
                  </p>
                )}
                <p className="text-2xs text-muted-foreground">
                  {v.changedBy} ·{" "}
                  {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              {onRollback && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Roll back to this version"
                        disabled={isPending}
                      />
                    }
                  >
                    <Undo2 className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Roll back to v{v.majorVersion}.{v.minorVersion}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        The article content will be restored to this version and
                        a new version will be created. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
                      <AlertDialogCancel
                        variant="default"
                        onClick={() => onRollback(v.id)}
                      >
                        Roll back
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
