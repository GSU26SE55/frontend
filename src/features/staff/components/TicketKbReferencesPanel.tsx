import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, ExternalLink } from "lucide-react";
import {
  useTicketKbRefs,
  useAddTicketKbRef,
  useRemoveTicketKbRef,
} from "../hooks/useTicketKbRefs";
import {
  KbReferenceTypeEnum,
  KbReferenceTypeLabel,
} from "@/shared/enums/kb.enum";
import { KbArticleSelector } from "@/shared/components/common/kb/KbArticleSelector";
import type { KbReferenceTypeEnum as RefType } from "@/shared/enums/kb.enum";

interface TicketKbReferencesPanelProps {
  ticketId: string;
}

export default function TicketKbReferencesPanel({
  ticketId,
}: TicketKbReferencesPanelProps) {
  const navigate = useNavigate();
  const { data: refs, isLoading } = useTicketKbRefs(ticketId);
  const { mutate: addRef, isPending: adding } = useAddTicketKbRef(ticketId);
  const { mutate: removeRef } = useRemoveTicketKbRef(ticketId);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refType, setRefType] = useState<string>(
    String(KbReferenceTypeEnum.ConsultedDuringResolve),
  );
  const [note, setNote] = useState("");

  const handleAdd = () => {
    for (const kbArticleId of selectedIds) {
      addRef({
        kbArticleId,
        referenceType: Number(refType) as RefType,
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

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Bài viết KB liên quan</h3>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="size-3.5" />
          Gắn bài viết
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <KbArticleSelector value={selectedIds} onChange={setSelectedIds} />

            <Select value={refType} onValueChange={setRefType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KbReferenceTypeLabel).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                Thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {refs && refs.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          Chưa có bài viết KB nào được gắn.
        </div>
      )}

      <div className="space-y-2">
        {refs?.map((ref) => (
          <Card key={ref.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ref.kbArticleCode}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {KbReferenceTypeLabel[ref.referenceType]}
                  </span>
                </div>
                {ref.kbArticleTitle && (
                  <p className="truncate text-sm">{ref.kbArticleTitle}</p>
                )}
                {ref.note && (
                  <p className="truncate text-xs text-muted-foreground">
                    {ref.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => navigate(`/staff/kb/${ref.kbArticleId}`)}
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
}
