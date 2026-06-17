import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  Wrench,
  Eye,
  ThumbsUp,
  User,
  CalendarDays,
  Clock,
  Hash,
  ArrowLeft,
  Tag,
  RefreshCcw,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { KbStatusBadge } from "./KbStatusBadge";
import { KbCategoryLabel } from "@/shared/enums/kb.enum";
import type { KbArticleDTO } from "@/shared/types/kb.types";

// ── Sections ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: "symptoms" as const, label: "Triệu chứng", icon: AlertTriangle },
  {
    key: "diagnosisSteps" as const,
    label: "Bước chẩn đoán",
    icon: Stethoscope,
  },
  {
    key: "solutionSteps" as const,
    label: "Hướng giải quyết",
    icon: CheckCircle2,
  },
  {
    key: "recommendedParts" as const,
    label: "Linh kiện khuyến nghị",
    icon: Wrench,
  },
] as const;

// ── Numbered list detection ───────────────────────────────────────────────────
function isNumberedList(text: string): boolean {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 1 && lines.every((l) => /^\d+[.)]\s/.test(l));
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

// ── Section content renderer ─────────────────────────────────────────────────
function SectionContent({ text }: { text: string }) {
  if (isNumberedList(text)) {
    return (
      <ol className="space-y-3">
        {parseLines(text).map((step, i) => (
          <li
            key={i}
            className="flex gap-3 text-sm leading-relaxed text-foreground/80"
          >
            <span className="shrink-0 mt-[1px] size-[22px] rounded-full border border-border bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
      {text}
    </p>
  );
}

// ── Sidebar metadata row ─────────────────────────────────────────────────────
function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="mt-[3px] shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        <div className="text-[13px] font-medium leading-tight">{value}</div>
      </div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
export function KbArticleDetailSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-6 w-80" />
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_272px] gap-5 mt-2">
        <Skeleton className="h-[500px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface KbArticleDetailProps {
  article: KbArticleDTO;
  backUrl: string;
  breadcrumb: string;
  /** Publish / Archive buttons */
  actions?: React.ReactNode;
  /** If provided, shows "Chỉnh sửa" button + renders a slide-in edit panel */
  renderEditor?: (props: { onClose: () => void }) => React.ReactNode;
}

export function KbArticleDetail({
  article,
  backUrl,
  breadcrumb,
  actions,
  renderEditor,
}: KbArticleDetailProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const visibleSections = SECTIONS.filter((s) => {
    if (s.key === "recommendedParts")
      return (article.recommendedParts?.length ?? 0) > 0;
    return true;
  });

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => navigate(backUrl)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">
              {breadcrumb} &middot;{" "}
              <span className="font-mono">{article.code}</span>
            </p>
            <h1 className="text-xl font-semibold tracking-tight leading-snug">
              {article.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <KbStatusBadge status={article.status} />
            {actions}
            {renderEditor && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        {/* ── Two-column body ─────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_272px] gap-5 items-start">
          {/* Left — article content */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {visibleSections.map((sec, idx) => {
              const Icon = sec.icon;
              const text =
                sec.key === "recommendedParts"
                  ? (article.recommendedParts ?? []).join("\n")
                  : (article[sec.key] as string);

              return (
                <div key={sec.key}>
                  {idx > 0 && <Separator />}
                  <div className="px-6 py-5">
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="size-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon size={12} className="text-muted-foreground" />
                      </div>
                      <h2 className="text-[13px] font-semibold text-foreground">
                        {sec.label}
                      </h2>
                    </div>
                    {/* Content */}
                    <SectionContent text={text} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — sidebar metadata */}
          <div className="border border-border rounded-xl bg-card divide-y divide-border/60 sticky top-4">
            {/* Stats */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thống kê
              </p>
              <div className="flex gap-5">
                <div className="flex items-center gap-1.5 text-sm">
                  <Eye size={13} className="text-muted-foreground" />
                  <span className="font-semibold tabular-nums">
                    {article.viewCount}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    lượt xem
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <ThumbsUp size={13} className="text-muted-foreground" />
                  <span className="font-semibold tabular-nums">
                    {article.helpfulCount}
                  </span>
                  <span className="text-muted-foreground text-xs">hữu ích</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="px-4 py-4 space-y-3.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Thông tin
              </p>
              <MetaItem
                icon={Hash}
                label="Mã bài viết"
                value={<span className="font-mono">{article.code}</span>}
              />
              <MetaItem
                icon={Tag}
                label="Danh mục"
                value={KbCategoryLabel[article.category] ?? article.category}
              />
              <MetaItem
                icon={RefreshCcw}
                label="Phiên bản"
                value={`v${article.version}`}
              />
              {article.isInternalOnly && (
                <MetaItem icon={User} label="Phạm vi" value="Chỉ nội bộ" />
              )}
              <MetaItem
                icon={CalendarDays}
                label="Ngày tạo"
                value={format(new Date(article.createdAt), "dd/MM/yyyy", {
                  locale: vi,
                })}
              />
              {article.updatedAt && (
                <MetaItem
                  icon={Clock}
                  label="Cập nhật lần cuối"
                  value={format(
                    new Date(article.updatedAt),
                    "dd/MM/yyyy HH:mm",
                    { locale: vi },
                  )}
                />
              )}
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="px-4 py-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[11px] font-normal px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit panel (slide from right, AuditLog pattern) ────────────────── */}
      {renderEditor && (
        <AnimatePresence>
          {editOpen && (
            <>
              <motion.div
                key="kb-edit-backdrop"
                className="fixed inset-0 z-50 bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setEditOpen(false)}
              />
              <motion.div
                key="kb-edit-panel"
                className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-popover text-popover-foreground shadow-2xl sm:max-w-[560px]"
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 32,
                  mass: 0.9,
                }}
              >
                {renderEditor({ onClose: () => setEditOpen(false) })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
