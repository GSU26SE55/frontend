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
} from "@/features/staff/hooks/ticket/useTicketKbRefs";
import { staffKbService } from "@/features/staff/services/kb/kb.service";
import { useKbSuggestions } from "@/shared/hooks/useSuggestions";
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
    "This article was consulted while handling the ticket.",
  [KbReferenceTypeEnum.ProvidedToCustomer]:
    "This article was sent/shared directly with the customer.",
  [KbReferenceTypeEnum.GeneratedAfterResolve]:
    "This article was created or updated from the experience of handling this ticket.",
};

interface TicketKbReferencesPanelProps {
  ticketId: string;
  defaultCategory?: TicketCategoryEnum;
  /** Allows attaching articles (matches BE: blocked from ClosedPendingRate onward). */
  canAdd?: boolean;
  /** Ticket is Resolved — only the 2 after-resolve types are recorded (matches BE guard H). */
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
  // AI-ranked suggestions — with a match score + reason, replacing the earlier
  // keyword-match list (which couldn't explain why an article was suggested).
  // topN=3: suggestions are meant for a quick read-then-decide; a long list dilutes
  // that — a technician who needs a different article can still use the "Attach
  // article" button to search manually.
  const { data: aiSuggest, isLoading: loadingSuggest } = useKbSuggestions(
    ticketId,
    { topN: 3 },
  );
  const { mutate: addRef, isPending: adding } = useAddTicketKbRef(ticketId);
  const { mutate: removeRef } = useRemoveTicketKbRef(ticketId);

  const suggested = useMemo(() => {
    const attachedIds = new Set((refs ?? []).map((r) => r.kbArticleId));
    return (aiSuggest?.items ?? []).filter(
      (s) => !attachedIds.has(s.kbArticleId),
    );
  }, [aiSuggest, refs]);

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

  // Consulted is invalid at Resolved (BE 422). Uses an effective refType (derived,
  // not reset via state in an effect) — if state is still Consulted when the ticket
  // moves to Resolved, add/display falls back to GeneratedAfterResolve.
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
            disabled={!canAdd}
            title={
              !canAdd
                ? "Ticket is already completed — cannot create an article"
                : undefined
            }
            onClick={() =>
              navigate("/staff/kb/new", {
                state: { ticketId, category: defaultCategory },
              })
            }
          >
            <FilePlus2 className="size-3.5" /> Create new article
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!canAdd}
            title={
              !canAdd
                ? "Ticket is already completed — cannot attach more articles"
                : undefined
            }
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

      {/* Always show this block: even when there's no matching article, it must be
          stated clearly — hiding it would leave the technician unsure whether AI
          even searched. */}
      {(loadingSuggest || aiSuggest !== undefined) && (
        <div className="space-y-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              AI-suggested articles
            </h4>
            {aiSuggest?.aiAvailable === false && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                AI temporarily unavailable
              </span>
            )}
          </div>

          {/* Make clear these are SUGGESTIONS, not already-attached articles — avoids
              the impression that the system auto-attached them to the ticket. */}
          {suggested.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Articles that may be related to this incident. Click{" "}
              <span className="font-medium">Attach</span> if you actually used
              it while resolving — until then it isn't recorded on the ticket.
            </p>
          )}

          {loadingSuggest && (
            <p className="text-[11px] text-muted-foreground">Analyzing...</p>
          )}

          {/* No matching article — still needs to be stated, with the AI's `note` if
              present (e.g. "no published articles yet") to explain why. */}
          {!loadingSuggest && suggested.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              {aiSuggest?.aiAvailable === false
                ? aiSuggest.note ||
                  'Couldn\'t get suggestions from AI. You can search manually with the "Attach article" button.'
                : aiSuggest?.note ||
                  "No matching guide article to suggest for this ticket."}
            </p>
          )}

          <div className="space-y-1.5">
            {suggested.map((item) => (
              <div
                key={item.kbArticleId}
                className="rounded-md bg-background px-2.5 py-2"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {item.code}
                      </span>
                      <span className="text-xs font-medium">{item.title}</span>
                      <span
                        className={`rounded px-1 py-0.5 text-[9.5px] font-semibold ${toneFill("muted")}`}
                      >
                        {Math.round(item.score * 100)}% match
                      </span>
                    </div>
                    {/* Reason — the basis for the technician to trust the ranking order. */}
                    {item.reason && (
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 shrink-0 gap-1 px-2 text-[11px]"
                    disabled={!canAdd || adding || afterResolveOnly}
                    title={
                      afterResolveOnly
                        ? "Ticket is Resolved — only after-resolve articles are recorded"
                        : undefined
                    }
                    onClick={() =>
                      addRef({
                        kbArticleId: item.kbArticleId,
                        referenceType:
                          KbReferenceTypeEnum.ConsultedDuringResolve,
                      })
                    }
                  >
                    <Plus className="size-3" /> Attach
                  </Button>
                </div>
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
                  placeholder="Note (optional)..."
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
            No guide article has been attached to this ticket yet.
          </p>
          {canAdd ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="size-3.5" /> Attach a guide article
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              You must start handling the ticket before attaching a guide
              article.
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
