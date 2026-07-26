import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { noData } from "@/shared/constants/emptyStates";

interface SubIssueItem {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

interface Props {
  ticketId: string;
}

// Lưu ý: parent PHẢI render với `key={ticketId}` để component remount khi
// chuyển sang ticket khác — tránh setState trong effect khi ticketId đổi.

const storageKey = (ticketId: string) => `staff-sub-issues:${ticketId}`;

function readItems(ticketId: string): SubIssueItem[] {
  try {
    const raw = localStorage.getItem(storageKey(ticketId));
    return raw ? (JSON.parse(raw) as SubIssueItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Danh sách "sub issue" — staff tự chia nhỏ ticket thành các việc con (tên +
 * mô tả), kiểu checklist sub-issue của GitHub. CHƯA có endpoint backend cho
 * việc này — lưu tạm ở localStorage theo ticketId (không đồng bộ giữa các
 * thiết bị/người dùng) cho tới khi có API riêng.
 */
export default function SubIssuePanel({ ticketId }: Props) {
  const [items, setItems] = useState<SubIssueItem[]>(() => readItems(ticketId));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const persist = (next: SubIssueItem[]) => {
    setItems(next);
    localStorage.setItem(storageKey(ticketId), JSON.stringify(next));
  };

  const addItem = () => {
    if (!title.trim()) return;
    const item: SubIssueItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      done: false,
    };
    persist([...items, item]);
    setTitle("");
    setDescription("");
    setCreating(false);
  };

  const toggleDone = (id: string) =>
    persist(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const removeItem = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    persist(items.filter((i) => i.id !== id));
  };

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {items.length > 0
            ? `${doneCount}/${items.length} hoàn thành`
            : noData("sub issue")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreating((c) => !c)}
        >
          <Plus size={13} /> Thêm sub issue
        </Button>
      </div>

      {creating && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <Input
            placeholder="Tên sub issue..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Mô tả chi tiết..."
            rows={2}
            className="text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreating(false)}
            >
              Hủy
            </Button>
            <Button size="sm" disabled={!title.trim()} onClick={addItem}>
              Tạo
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !creating ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chia nhỏ ticket thành các việc con để dễ theo dõi tiến độ.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <li key={item.id} className="rounded-lg border border-border">
                <div className="flex items-start gap-2 p-2.5">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() => toggleDone(item.id)}
                    className="mt-0.5"
                  />
                  <button
                    type="button"
                    className="flex flex-1 items-start gap-1.5 text-left"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                  >
                    {item.description ? (
                      expanded ? (
                        <ChevronDown
                          size={14}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />
                      )
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        item.done && "line-through text-muted-foreground",
                      )}
                    >
                      {item.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Xóa sub issue"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {expanded && item.description && (
                  <p className="whitespace-pre-wrap px-9 pb-2.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
