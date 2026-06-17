import type { KbArticleDiffDTO, DiffSection } from "@/shared/types/kb.types";

const FIELDS: { key: keyof KbArticleDiffDTO; label: string }[] = [
  { key: "titleDiff", label: "Tiêu đề" },
  { key: "symptomsDiff", label: "Triệu chứng" },
  { key: "diagnosisStepsDiff", label: "Bước chẩn đoán" },
  { key: "solutionStepsDiff", label: "Hướng giải quyết" },
  { key: "recommendedPartsDiff", label: "Linh kiện khuyến nghị" },
  { key: "tagsDiff", label: "Thẻ" },
];

function Row({ label, diff }: { label: string; diff: DiffSection }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
        <span className="text-xs font-semibold">{label}</span>
        {diff.isChanged && (
          <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">
            Đã thay đổi
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 divide-x divide-border">
        <div className="p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Cũ</p>
          <p className="text-xs whitespace-pre-wrap text-foreground/70">
            {diff.oldValue || "—"}
          </p>
        </div>
        <div className={`p-3 ${diff.isChanged ? "bg-emerald-50/50" : ""}`}>
          <p className="text-[10px] text-muted-foreground mb-1">Mới</p>
          <p className="text-xs whitespace-pre-wrap">{diff.newValue || "—"}</p>
        </div>
      </div>
    </div>
  );
}

export function KbDiffViewer({ diff }: { diff: KbArticleDiffDTO }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        So sánh phiên bản <span className="font-mono">{diff.fromVersion}</span>{" "}
        → <span className="font-mono">{diff.toVersion}</span>
      </p>
      {FIELDS.map((f) => (
        <Row key={f.key} label={f.label} diff={diff[f.key] as DiffSection} />
      ))}
    </div>
  );
}
