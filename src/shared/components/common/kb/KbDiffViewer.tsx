import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Columns2,
  FileText,
  Rows,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { diffLines, toSplitRows } from "@/shared/lib/lineDiff";
import type { DiffLine, SplitRow } from "@/shared/lib/lineDiff";
import type { KbArticleDiffDTO, DiffSection } from "@/shared/types/kb.types";

type ViewMode = "unified" | "split";

const FIELDS: { key: keyof KbArticleDiffDTO; label: string }[] = [
  { key: "titleDiff",             label: "Tiêu đề" },
  { key: "symptomsDiff",          label: "Triệu chứng" },
  { key: "diagnosisStepsDiff",    label: "Bước chẩn đoán" },
  { key: "solutionStepsDiff",     label: "Hướng giải quyết" },
  { key: "recommendedPartsDiff",  label: "Linh kiện khuyến nghị" },
  { key: "tagsDiff",              label: "Thẻ" },
];

// ── Gutter cell (line number) ────────────────────────────────────────────────
function Gutter({ no, type }: { no: number | null; type: "eq" | "del" | "add" | "empty" }) {
  return (
    <td
      className={cn(
        "select-none text-right align-top tabular-nums",
        "w-12 px-3 py-1 text-[12px] font-mono border-r",
        type === "del"
          ? "bg-[#ffebe9] border-[#ffc0bc] text-[#82071e]/60"
          : type === "add"
          ? "bg-[#e6ffec] border-[#abf2bc] text-[#116329]/60"
          : type === "empty"
          ? "bg-[#eaeef2] border-[#d0d7de]"
          : "bg-[#f6f8fa] border-[#d0d7de] text-[#57606a]",
      )}
    >
      {no ?? ""}
    </td>
  );
}

// ── Sign cell (+/-) ──────────────────────────────────────────────────────────
function Sign({ type }: { type: "eq" | "del" | "add" | "empty" }) {
  return (
    <td
      className={cn(
        "select-none w-6 px-1 py-1 text-center align-top font-mono text-[13px] font-bold",
        type === "del"
          ? "bg-[#ffebe9] text-[#cf222e]"
          : type === "add"
          ? "bg-[#e6ffec] text-[#116329]"
          : type === "empty"
          ? "bg-[#eaeef2]"
          : "bg-[#f6f8fa] text-transparent",
      )}
    >
      {type === "del" ? "-" : type === "add" ? "+" : type === "empty" ? "" : " "}
    </td>
  );
}

// ── Content cell ─────────────────────────────────────────────────────────────
function CodeCell({
  text,
  type,
}: {
  text: string;
  type: "eq" | "del" | "add" | "empty";
}) {
  return (
    <td
      className={cn(
        "px-3 py-1 align-top whitespace-pre-wrap break-words text-[13px] font-mono leading-[20px]",
        type === "del" ? "bg-[#ffebe9]" : type === "add" ? "bg-[#e6ffec]" : type === "empty" ? "bg-[#eaeef2]" : "bg-white dark:bg-background",
      )}
    >
      {text || " "}
    </td>
  );
}

// ── Unified view ─────────────────────────────────────────────────────────────
function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <table className="w-full border-collapse font-mono">
      <tbody>
        {lines.map((l, i) => (
          <tr key={i}>
            <Gutter no={l.oldNo} type={l.type === "add" ? "empty" : l.type} />
            <Gutter no={l.newNo} type={l.type === "del" ? "empty" : l.type} />
            <Sign type={l.type} />
            <CodeCell text={l.text} type={l.type} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Split view ────────────────────────────────────────────────────────────────
function SplitSide({ side }: { side: SplitRow["left"] | SplitRow["right"] }) {
  return (
    <>
      <Gutter no={side.lineNo} type={side.type} />
      <Sign type={side.type} />
      <CodeCell text={side.type === "empty" ? "" : side.text} type={side.type} />
    </>
  );
}

function SplitView({ rows }: { rows: SplitRow[] }) {
  return (
    <table className="w-full border-collapse font-mono table-fixed">
      <colgroup>
        <col className="w-12" /><col className="w-6" /><col />
        <col className="w-px bg-[#d0d7de]" />
        <col className="w-12" /><col className="w-6" /><col />
      </colgroup>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <SplitSide side={r.left} />
            <td className="w-px bg-[#d0d7de] p-0" />
            <SplitSide side={r.right} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Per-section block ─────────────────────────────────────────────────────────
function SectionBlock({
  label,
  diff,
  view,
  defaultOpen,
}: {
  label: string;
  diff: DiffSection;
  view: ViewMode;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const computed = useMemo(() => {
    const result = diffLines(diff.oldValue ?? "", diff.newValue ?? "");
    const split = view === "split" ? toSplitRows(result.lines) : [];
    return { ...result, split };
  }, [diff.oldValue, diff.newValue, view]);

  const { added, removed } = computed.stats;
  const isEmpty = !diff.oldValue && !diff.newValue;

  return (
    <div className="border border-[#d0d7de] rounded-md overflow-hidden">
      {/* File-header bar — GitHub style */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left",
          "bg-[#f6f8fa] dark:bg-muted/50 hover:bg-[#eaeef2] dark:hover:bg-muted/70 transition-colors",
          "border-b border-[#d0d7de]",
          !open && "border-b-0",
        )}
      >
        {open
          ? <ChevronDown className="size-4 text-[#57606a] shrink-0" />
          : <ChevronRight className="size-4 text-[#57606a] shrink-0" />}
        <FileText className="size-4 text-[#57606a] shrink-0" />
        <span className="text-[13px] font-semibold text-[#24292f] dark:text-foreground flex-1">
          {label}
        </span>
        {diff.isChanged ? (
          <div className="flex items-center gap-2 text-[12px] font-mono font-semibold">
            {added > 0 && (
              <span className="text-[#116329] dark:text-emerald-400">+{added}</span>
            )}
            {removed > 0 && (
              <span className="text-[#cf222e] dark:text-red-400">−{removed}</span>
            )}
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(5, added + removed) }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block w-2.5 h-3 rounded-sm",
                    i < Math.round((added / (added + removed || 1)) * Math.min(5, added + removed))
                      ? "bg-[#2da44e]"
                      : "bg-[#cf222e]",
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-[#57606a] font-medium">Không thay đổi</span>
        )}
      </button>

      {open && (
        <div className="overflow-x-auto">
          {isEmpty ? (
            <p className="px-4 py-6 text-sm text-[#57606a] text-center italic">(trống)</p>
          ) : view === "unified" ? (
            <UnifiedView lines={computed.lines} />
          ) : (
            <SplitView rows={computed.split} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function KbDiffViewer({ diff }: { diff: KbArticleDiffDTO }) {
  const [view, setView] = useState<ViewMode>("unified");

  const total = useMemo(() => {
    let added = 0, removed = 0;
    for (const f of FIELDS) {
      const sec = diff[f.key] as DiffSection;
      const { stats } = diffLines(sec.oldValue ?? "", sec.newValue ?? "");
      added += stats.added;
      removed += stats.removed;
    }
    return { added, removed };
  }, [diff]);

  return (
    <div className="space-y-3">
      {/* Toolbar — GitHub-style comparison header */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-md border border-[#d0d7de] bg-[#f6f8fa] dark:bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[#57606a]">So sánh</span>
          <code className="rounded border border-[#d0d7de] bg-white dark:bg-background px-2 py-0.5 font-mono text-[12px] font-semibold">
            {diff.fromVersion}
          </code>
          <span className="text-[#57606a]">→</span>
          <code className="rounded border border-[#d0d7de] bg-white dark:bg-background px-2 py-0.5 font-mono text-[12px] font-semibold">
            {diff.toVersion}
          </code>
          <span className="ml-3 flex items-center gap-1.5 font-mono font-semibold text-[13px]">
            <span className="text-[#116329] dark:text-emerald-400">+{total.added}</span>
            <span className="text-[#cf222e] dark:text-red-400">−{total.removed}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-[#d0d7de] bg-white dark:bg-background p-0.5">
          <Button
            size="sm"
            variant={view === "unified" ? "default" : "ghost"}
            className="h-7 px-3 text-[12px] gap-1.5"
            onClick={() => setView("unified")}
          >
            <Rows className="size-3.5" />
            Unified
          </Button>
          <Button
            size="sm"
            variant={view === "split" ? "default" : "ghost"}
            className="h-7 px-3 text-[12px] gap-1.5"
            onClick={() => setView("split")}
          >
            <Columns2 className="size-3.5" />
            Split
          </Button>
        </div>
      </div>

      {/* Section blocks */}
      {FIELDS.map((f) => {
        const sec = diff[f.key] as DiffSection;
        return (
          <SectionBlock
            key={f.key}
            label={f.label}
            diff={sec}
            view={view}
            defaultOpen={sec.isChanged}
          />
        );
      })}
    </div>
  );
}
