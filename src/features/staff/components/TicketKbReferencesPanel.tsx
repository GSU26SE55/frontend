import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, ExternalLink, X } from "lucide-react";
import {
  useTicketKbRefs,
  useAddTicketKbRef,
  useRemoveTicketKbRef,
} from "../hooks/useTicketKbRefs";
import { useStaffKbSuggest } from "../hooks/useStaffKb";
import {
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
  KbArticleStatusEnum,
} from "@/shared/enums/kb.enum";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";
import { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import { KbArticleSelector } from "@/shared/components/common/kb/KbArticleSelector";
import type { KbReferenceTypeEnum as RefType } from "@/shared/enums/kb.enum";
import { cn } from "@/lib/utils";

const REF_TYPE_ORDER: RefType[] = [
  KbReferenceTypeEnum.ConsultedDuringResolve,
  KbReferenceTypeEnum.ProvidedToCustomer,
  KbReferenceTypeEnum.GeneratedAfterResolve,
];

const REF_TYPE_BADGE: Record<RefType, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]:
    "border-blue-500/40 text-blue-700 bg-blue-500/10 dark:text-blue-300",
  [KbReferenceTypeEnum.ProvidedToCustomer]:
    "border-emerald-500/40 text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
  [KbReferenceTypeEnum.GeneratedAfterResolve]:
    "border-purple-500/40 text-purple-700 bg-purple-500/10 dark:text-purple-300",
};

const REF_TYPE_DESC: Record<RefType, string> = {
  [KbReferenceTypeEnum.ConsultedDuringResolve]:
    "Bài này được tham khảo trong lúc xử lý ticket.",
  [KbReferenceTypeEnum.ProvidedToCustomer]:
    "Bài này đã được gửi/share trực tiếp cho khách hàng.",
  [KbReferenceTypeEnum.GeneratedAfterResolve]:
    "Bài này được tạo mới hoặc cập nhật từ kinh nghiệm xử lý ticket này.",
};

interface TicketKbReferencesPanelProps {
  ticketId: string;
  defaultCategory?: TicketCategoryEnum;
  /** Chỉ cho phép gắn bài viết sau khi đã "Bắt đầu xử lý" (InProgress/Waiting). */
  canAdd?: boolean;
}

export default function TicketKbReferencesPanel({
  ticketId,
  defaultCategory,
  canAdd = true,
}: TicketKbReferencesPanelProps) {
  const navigate = useNavigate();
  const { data: refs, isLoading } = useTicketKbRefs(ticketId);
  const { mutate: addRef, isPending: adding } = useAddTicketKbRef(ticketId);
  const { mutate: removeRef } = useRemoveTicketKbRef(ticketId);
  const { data: suggestItems } = useStaffKbSuggest(ticketId);
  const selectorOptions: KbArticleSummaryDTO[] = (suggestItems ?? []).map(
    (item) => ({
      id: item.id,
      code: item.code,
      title: item.title,
      category: defaultCategory ?? TicketCategoryEnum.Other,
      status: KbArticleStatusEnum.Published,
      viewCount: item.viewCount,
      helpfulCount: item.helpfulCount,
      reviewRequired: false,
      createdAt: "",
    }),
  );

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refType, setRefType] = useState<RefType>(
    KbReferenceTypeEnum.ConsultedDuringResolve,
  );
  const [note, setNote] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<RefType, NonNullable<typeof refs>>();
    REF_TYPE_ORDER.forEach((t) => map.set(t, []));
    (refs ?? []).forEach((ref) => {
      const list = map.get(ref.referenceType as RefType);
      if (list) list.push(ref);
    });
    return map;
  }, [refs]);

  const handleAdd = () => {
    for (const kbArticleId of selectedIds) {
      addRef({
        kbArticleId,
        referenceType: refType,
        note: note || undefined,
      });
    }
    setSelectedIds([]);
    setNote("");
    setShowAdd(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const totalRefs = refs?.length ?? 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Bài viết KB liên quan
          {totalRefs > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({totalRefs})
            </span>
          )}
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={!canAdd}
          title={
            !canAdd
              ? "Cần bắt đầu xử lý ticket trước khi gắn bài viết"
              : undefined
          }
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showAdd ? "Đóng" : "Gắn bài viết"}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {showAdd && (
          <motion.div
            key="add-panel"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <Card>
              <CardContent className="p-4 space-y-3">
                <KbArticleSelector
                  value={selectedIds}
                  onChange={setSelectedIds}
                  options={selectorOptions}
                  defaultCategory={defaultCategory}
                />

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Loại tham chiếu
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {REF_TYPE_ORDER.map((t) => {
                      const active = refType === t;
                      return (
                        <Button
                          key={t}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className="h-7 text-xs"
                          title={REF_TYPE_DESC[t]}
                          onClick={() => setRefType(t)}
                        >
                          {KbReferenceTypeLabel[t]}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    {REF_TYPE_DESC[refType]}
                  </p>
                </div>

                <Input
                  placeholder="Ghi chú (tùy chọn)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAdd(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedIds.length === 0 || adding}
                    onClick={handleAdd}
                  >
                    Thêm {selectedIds.length > 0 && `(${selectedIds.length})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {totalRefs === 0 && !showAdd && (
        <div className="rounded-lg border border-dashed py-10 px-4 text-center">
          <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-3">
            Chưa có bài viết KB nào được gắn vào ticket này.
          </p>
          {canAdd ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="size-3.5" /> Gán bài hướng dẫn
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cần bắt đầu xử lý ticket trước khi gắn bài viết hướng dẫn.
            </p>
          )}
        </div>
      )}

      {totalRefs > 0 && (
        <div className="space-y-4">
          {REF_TYPE_ORDER.map((type) => {
            const items = grouped.get(type) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {KbReferenceTypeLabel[type]}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    ({items.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((ref) => (
                    <Card key={ref.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">
                              {ref.kbArticleCode}
                            </span>
                            <span
                              className={cn(
                                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                                REF_TYPE_BADGE[type],
                              )}
                            >
                              {KbReferenceTypeLabel[type]}
                            </span>
                          </div>
                          {ref.kbArticleTitle && (
                            <p className="truncate text-sm mt-0.5">
                              {ref.kbArticleTitle}
                            </p>
                          )}
                          {ref.note && (
                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                              {ref.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() =>
                              navigate(`/staff/kb/${ref.kbArticleId}`)
                            }
                            title="Xem bài viết"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => removeRef(ref.id)}
                            title="Gỡ"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
