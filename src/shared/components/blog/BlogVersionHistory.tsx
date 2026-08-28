import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { BlogPostVersionDTO } from "@/shared/types/blog/blog.types";

interface BlogVersionHistoryProps {
  versions: BlogPostVersionDTO[];
  /** ⚠️ Blog compare uses the version NUMBER (KB uses Guid versionId). */
  onCompare: (oldVersionNumber: number, newVersionNumber: number) => void;
  isPending?: boolean;
}

export function BlogVersionHistory({
  versions,
  onCompare,
  isPending,
}: BlogVersionHistoryProps) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (versionNumber: number) => {
    setSelected((prev) =>
      prev.includes(versionNumber)
        ? prev.filter((v) => v !== versionNumber)
        : [...prev, versionNumber].slice(-2),
    );
  };

  const handleCompare = () => {
    if (selected.length !== 2) return;
    const [a, b] = [...selected].sort((x, y) => x - y);
    onCompare(a, b);
  };

  if (versions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No versions yet. Each update to the post creates a new version.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Select 2 versions to compare ({selected.length}/2)
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={selected.length !== 2 || isPending}
          onClick={handleCompare}
        >
          Compare
        </Button>
      </div>

      <ul className="divide-border divide-y rounded-md border">
        {versions.map((v) => {
          const checked = selected.includes(v.versionNumber);
          return (
            <li
              key={v.id}
              className={cn(
                "flex items-start gap-3 px-3 py-2",
                checked && "bg-accent/50",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(v.versionNumber)}
                aria-label={`Select version ${v.versionNumber}`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    Version {v.versionNumber}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(v.createdAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                <p className="truncate text-sm">{v.title}</p>
                {v.changeNote && (
                  <p className="text-muted-foreground truncate text-xs italic">
                    {v.changeNote}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
