import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  FilePlus2,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Sparkles,
} from "lucide-react";
import {
  useTicketKbRefs,
  useAddTicketKbRef,
  useRemoveTicketKbRef,
} from "../hooks/useTicketKbRefs";
import { staffKbService } from "../services/kb.service";
import { useStaffKbSuggest, useStaffKbCreate } from "../hooks/useStaffKb";
import {
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
  KbArticleStatusEnum,
  KbCategoryCode,
} from "@/shared/enums/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import {
  KbArticleSelector,
  type KbArticleSearchParams,
} from "@/shared/components/common/kb/KbArticleSelector";
import { KbEditorPanel } from "@/shared/components/common/kb/KbEditorPanel";
import type { KbReferenceTypeEnum as RefType } from "@/shared/enums/kb.enum";
import type { UpdateKbArticlePayload } from "@/shared/types/kb.types";
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
  /** Cho phép gắn bài viết (khớp BE: chặn từ ClosedPendingRate trở đi). */
  canAdd?: boolean;
  /** Ticket ở Resolved — chỉ ghi nhận 2 type after-resolve (khớp BE guard H). */
  afterResolveOnly?: boolean;
}

export default function TicketKbReferencesPanel({
  ticketId,
  defaultCategory,
  canAdd = true,
  afterResolveOnly = false,
}: TicketKbReferencesPanelProps) {
  const navigate = useNavigate();
  const { data: refs, isLoading } = useTicketKbRefs(ticketId);
  const { data: suggestions } = useStaffKbSuggest(ticketId);
  const { mutate: addRef, isPending: adding } = useAddTicketKbRef(ticketId);
  const { mutate: removeRef } = useRemoveTicketKbRef(ticketId);
  const { mutateAsync: createArticle, isPending: creatingArticle } =
    useStaffKbCreate();

  const suggested = useMemo(() => {
    const attachedIds = new Set((refs ?? []).map((r) => r.kbArticleId));
    return (suggestions ?? []).filter((s) => !attachedIds.has(s.id));
  }, [suggestions, refs]);

  const searchArticles = useCallback(
    ({ q, category }: KbArticleSearchParams) =>
      staffKbService
        .getList({
          q,
          category: category ? KbCategoryCode[category] : undefined,
          status: KbArticleStatusEnum.Published,
          pageSize: 20,
        })
        .then((r) => r.data.data?.items ?? []),
    [],
  );

  const getArticleDetail = useCallback(
    (id: string) => staffKbService.getDetail(id).then((r) => r.data.data!),
    [],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refType, setRefType] = useState<RefType>(
    afterResolveOnly
      ? KbReferenceTypeEnum.GeneratedAfterResolve
      : KbReferenceTypeEnum.ConsultedDuringResolve,
  );
  const [note, setNote] = useState("");

  // H — ở Resolved BE chỉ cho 2 type after-resolve; ẩn ConsultedDuringResolve.
  const refTypeOptions: RefType[] = afterResolveOnly
    ? [
        KbReferenceTypeEnum.ProvidedToCustomer,
        KbReferenceTypeEnum.GeneratedAfterResolve,
      ]
    : REF_TYPE_ORDER;

  // Consulted không hợp lệ ở Resolved (BE 422). Dùng effective refType (derive,
  // không reset state trong effect) — nếu state còn Consulted khi chuyển sang
  // Resolved thì add/hiển thị như GeneratedAfterResolve.
  const effectiveRefType: RefType =
    afterResolveOnly && refType === KbReferenceTypeEnum.ConsultedDuringResolve
      ? KbReferenceTypeEnum.GeneratedAfterResolve
      : refType;

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
        referenceType: effectiveRefType,
        note: note || undefined,
      });
    }
    setSelectedIds([]);
    setNote("");
    setShowAdd(false);
  };

  const handleCreateSave = async (payload: UpdateKbArticlePayload) => {
    const res = await createArticle(payload);
    if (res?.id) {
      addRef({
        kbArticleId: res.id,
        referenceType: KbReferenceTypeEnum.GeneratedAfterResolve,
      });
    }
    setShowCreate(false);
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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!canAdd}
            title={
              !canAdd
                ? "Ticket đã hoàn thành — không thể tạo bài viết"
                : undefined
            }
            onClick={() => setShowCreate(true)}
          >
            <FilePlus2 className="size-3.5" /> Tạo bài viết mới
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!canAdd}
            title={
              !canAdd
                ? "Ticket đã hoàn thành — không thể gắn thêm bài viết"
                : undefined
            }
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? (
              <X className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {showAdd ? "Đóng" : "Gắn bài viết"}
          </Button>
        </div>
      </div>

      {suggested.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Gợi ý cho ticket này
            </h4>
          </div>
          <div className="space-y-1.5">
            {suggested.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                    {item.code}
                  </span>
                  <span className="truncate text-xs">{item.title}</span>
                  {item.isInternalOnly && (
                    <span className="ml-1.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9.5px] font-medium text-amber-700 dark:text-amber-300">
                      Nội bộ
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 shrink-0 gap-1 px-2 text-[11px]"
                  disabled={!canAdd || adding || afterResolveOnly}
                  title={
                    afterResolveOnly
                      ? "Ticket đã Resolved — chỉ ghi nhận bài sau xử lý"
                      : undefined
                  }
                  onClick={() =>
                    addRef({
                      kbArticleId: item.id,
                      referenceType: KbReferenceTypeEnum.ConsultedDuringResolve,
                    })
                  }
                >
                  <Plus className="size-3" /> Gắn
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  searchFn={searchArticles}
                  getDetailFn={getArticleDetail}
                />

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Loại tham chiếu
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {refTypeOptions.map((t) => {
                      const active = effectiveRefType === t;
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
                    {REF_TYPE_DESC[effectiveRefType]}
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

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              key="kb-create-backdrop"
              className="fixed inset-0 z-50 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              key="kb-create-panel"
              className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-popover text-popover-foreground shadow-2xl sm:max-w-140"
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
              <KbEditorPanel
                initialCategory={defaultCategory}
                onClose={() => setShowCreate(false)}
                isPending={creatingArticle}
                onSave={handleCreateSave}
              />
            </motion.div>
          </>
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
