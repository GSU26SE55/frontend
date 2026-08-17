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
} from "@/features/manager/hooks/ticket/useTicketKbRefs";
import { managerKbService } from "@/features/manager/services/kb/kb.service";
import { useManagerKbSuggest } from "@/features/manager/hooks/kb/useManagerKb";
import {
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
  KbArticleStatusEnum,
  KbCategoryCode,
} from "@/shared/enums/kb/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import {
  KbArticleSelector,
  type KbArticleSearchParams,
} from "@/shared/components/kb/KbArticleSelector";
import type { KbReferenceTypeEnum as RefType } from "@/shared/enums/kb/kb.enum";
import { cn } from "@/lib/utils";
import { toneFill } from "@/shared/theme/statusColors";

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
    "This article was consulted while working on the ticket.",
  [KbReferenceTypeEnum.ProvidedToCustomer]:
    "This article was sent/shared directly with the customer.",
  [KbReferenceTypeEnum.GeneratedAfterResolve]:
    "This article was created or updated from the experience of resolving this ticket.",
};

interface TicketKbReferencesPanelProps {
  ticketId: string;
  defaultCategory?: TicketCategoryEnum;
  /** Ticket is Resolved — only records the 2 after-resolve types (matches BE guard H). */
  afterResolveOnly?: boolean;
}

export default function TicketKbReferencesPanel({
  ticketId,
  defaultCategory,
  afterResolveOnly = false,
}: TicketKbReferencesPanelProps) {
  const navigate = useNavigate();
  const { data: refs, isLoading } = useTicketKbRefs(ticketId);
  const { data: suggestions } = useManagerKbSuggest(ticketId);
  const { mutate: addRef, isPending: adding } = useAddTicketKbRef(ticketId);
  const { mutate: removeRef } = useRemoveTicketKbRef(ticketId);

  const suggested = useMemo(() => {
    const attachedIds = new Set((refs ?? []).map((r) => r.kbArticleId));
    return (suggestions ?? []).filter((s) => !attachedIds.has(s.id));
  }, [suggestions, refs]);

  const searchArticles = useCallback(
    ({ q, category }: KbArticleSearchParams) =>
      managerKbService
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
    (id: string) => managerKbService.getDetail(id).then((r) => r.data.data!),
    [],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refType, setRefType] = useState<RefType>(
    afterResolveOnly
      ? KbReferenceTypeEnum.GeneratedAfterResolve
      : KbReferenceTypeEnum.ConsultedDuringResolve,
  );
  const [note, setNote] = useState("");

  // H — at Resolved the BE only allows the 2 after-resolve types; hide ConsultedDuringResolve.
  const refTypeOptions: RefType[] = afterResolveOnly
    ? [
        KbReferenceTypeEnum.ProvidedToCustomer,
        KbReferenceTypeEnum.GeneratedAfterResolve,
      ]
    : REF_TYPE_ORDER;

  // Consulted isn't valid at Resolved (BE 422). Use an effective refType (derived,
  // not reset via state in an effect) — if state still holds Consulted when moving
  // to Resolved, add/display it as GeneratedAfterResolve.
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
          Related guide articles
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
            onClick={() =>
              navigate("/manager/kb/new", {
                state: { ticketId, category: defaultCategory },
              })
            }
          >
            <FilePlus2 className="size-3.5" /> New article
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? (
              <X className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {showAdd ? "Close" : "Attach article"}
          </Button>
        </div>
      </div>

      {suggested.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Suggested for this ticket
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
                    <span
                      className={`ml-1.5 rounded px-1 py-0.5 text-[9.5px] font-medium ${toneFill("muted")}`}
                    >
                      Internal
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 shrink-0 gap-1 px-2 text-[11px]"
                  disabled={adding || afterResolveOnly}
                  title={
                    afterResolveOnly
                      ? "Ticket is Resolved — only after-resolve articles can be recorded"
                      : undefined
                  }
                  onClick={() =>
                    addRef({
                      kbArticleId: item.id,
                      referenceType: KbReferenceTypeEnum.ConsultedDuringResolve,
                    })
                  }
                >
                  <Plus className="size-3" /> Attach
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
                    Reference type
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
                  placeholder="Notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedIds.length === 0 || adding}
                    onClick={handleAdd}
                  >
                    Add {selectedIds.length > 0 && `(${selectedIds.length})`}
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
            No guide articles attached to this ticket yet.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="size-3.5" /> Attach a guide
          </Button>
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
                              navigate(`/manager/kb/${ref.kbArticleId}`)
                            }
                            title="View article"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => removeRef(ref.id)}
                            title="Remove"
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
