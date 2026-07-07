import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { EllipsisVertical, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import {
  ActorRoleEnum,
  type TicketCommentDTO,
} from "@/shared/types/ticket.types";

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Khách hàng",
  System: "Hệ thống",
};

// Mirror BE ChatOptions.EditWindowMinutes (15) — chỉ dùng để gợi ý UI, BE luôn
// là nguồn xác thực cuối cùng.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

const LANGUAGE_OPTIONS = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
] as const;
const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.code, l.label]),
);

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export type ChatTab = "public" | "internal";

interface TicketCommentThreadProps {
  comments: TicketCommentDTO[];
  currentUserId?: string | null;
  /** Controlled tab — nếu truyền, bình luận mới sẽ gửi theo tab này (page điều khiển). */
  activeTab?: ChatTab;
  onTabChange?: (tab: ChatTab) => void;
  /** = checkPermission(user, P.CHAT_EDIT_ANY) — sửa tin của người khác */
  canEditAny?: boolean;
  /** = checkPermission(user, P.CHAT_DELETE_ANY) — xóa tin của người khác */
  canDeleteAny?: boolean;
  /** Ticket đã Closed — khóa toàn bộ sửa/xóa (BE enforce tương tự) */
  ticketClosed?: boolean;
  onEdit?: (chat: TicketCommentDTO, body: string) => void;
  onDelete?: (chat: TicketCommentDTO) => void;
  editPending?: boolean;
  deletePending?: boolean;
  /** Housekeeping — báo đã đọc các chat đang hiển thị (không có unread badge để wire) */
  onMarkRead?: (chatIds: string[]) => void;
  /** Mọi role đều được dịch (BE không giới hạn quyền) — có prop này là hiện menu dịch */
  onTranslate?: (
    chat: TicketCommentDTO,
    targetLanguage: string,
  ) => Promise<{ translatedBody: string; targetLanguage: string } | undefined>;
}

/** Khung chat dạng bong bóng — TÁCH 2 tab: Công khai (khách thấy) & Nội bộ (chỉ nhân viên). */
export function TicketCommentThread({
  comments,
  currentUserId,
  activeTab,
  onTabChange,
  canEditAny = false,
  canDeleteAny = false,
  ticketClosed = false,
  onEdit,
  onDelete,
  editPending = false,
  deletePending = false,
  onMarkRead,
  onTranslate,
}: TicketCommentThreadProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>("public");
  const tab = activeTab ?? internalTab;
  const setTab = (t: ChatTab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  // Cũ lên trên, mới nhất ở dưới cùng — chuẩn giao diện chat.
  const sorted = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  const publicCount = useMemo(
    () => sorted.filter((c) => !c.isInternal).length,
    [sorted],
  );
  const internalCount = sorted.length - publicCount;

  const visible = useMemo(
    () =>
      sorted.filter((c) => (tab === "internal" ? c.isInternal : !c.isInternal)),
    [sorted, tab],
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [visible.length, tab]);

  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!onMarkRead) return;
    const unmarked = visible
      .map((c) => c.id)
      .filter((id) => !markedRef.current.has(id));
    if (unmarked.length === 0) return;
    unmarked.forEach((id) => markedRef.current.add(id));
    onMarkRead(unmarked);
  }, [visible, onMarkRead]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<TicketCommentDTO | null>(
    null,
  );

  // "now" lấy qua state cập nhật định kỳ — tránh gọi Date.now() (impure) trực
  // tiếp trong quá trình render khi tính withinEditWindow cho từng comment.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isOwnComment = (c: TicketCommentDTO) =>
    !!currentUserId && c.authorUserId === currentUserId;
  const withinEditWindow = (c: TicketCommentDTO) =>
    now - new Date(c.createdAt).getTime() <= EDIT_WINDOW_MS;

  const startEdit = (c: TicketCommentDTO) => {
    setEditingId(c.id);
    setEditBody(c.body);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditBody("");
  };
  const saveEdit = (c: TicketCommentDTO) => {
    onEdit?.(c, editBody.trim());
    cancelEdit();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDelete?.(deleteTarget);
    setDeleteTarget(null);
  };

  // Bản dịch giữ cục bộ theo chatId — cho phép toggle gốc/dịch không cần gọi
  // lại BE (BE đã cache theo (chatId, targetLanguage) ở tầng DB).
  const [translations, setTranslations] = useState<
    Record<string, { lang: string; text: string }>
  >({});
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(
    new Set(),
  );
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const handleTranslate = async (c: TicketCommentDTO, lang: string) => {
    if (!onTranslate) return;
    setTranslatingId(c.id);
    try {
      const result = await onTranslate(c, lang);
      if (result) {
        setTranslations((prev) => ({
          ...prev,
          [c.id]: { lang: result.targetLanguage, text: result.translatedBody },
        }));
        setShowOriginalIds((prev) => {
          if (!prev.has(c.id)) return prev;
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      }
    } finally {
      setTranslatingId(null);
    }
  };

  const toggleShowOriginal = (chatId: string) => {
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {/* Tab tách Công khai / Nội bộ — dính đầu khi cuộn, nền che kín tin nhắn phía sau */}
      <div className="sticky -top-6 z-20 -mx-6 -mt-6 bg-background px-6 pt-6 flex items-center gap-1 border-b border-border pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setTab("public")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            tab === "public"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Globe className="size-3.5" />
          Công khai
          <span className="text-[11px] tabular-nums opacity-70">
            ({publicCount})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("internal")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            tab === "internal"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Lock className="size-3.5" />
          Nội bộ
          <span className="text-[11px] tabular-nums opacity-70">
            ({internalCount})
          </span>
        </button>
      </div>

      {/* Ghi chú ngữ cảnh tab đang xem */}
      <p className="text-[11px] text-muted-foreground px-1 pt-2 pb-1 shrink-0">
        {tab === "public"
          ? "Bình luận công khai — khách hàng có thể xem."
          : "Bình luận nội bộ — chỉ nhân viên xử lý ticket xem được."}
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {tab === "public"
            ? "Chưa có bình luận công khai."
            : "Chưa có bình luận nội bộ."}
        </p>
      ) : (
        <div className="space-y-3 pt-2 pr-2">
          {visible.map((c) => {
            const isOwn = isOwnComment(c);
            const name =
              c.authorDisplayName ?? ROLE_LABEL[c.authorRole] ?? c.authorRole;
            const authorWindowOk = isOwn && withinEditWindow(c);
            const canEditThis = !ticketClosed && (authorWindowOk || canEditAny);
            const canDeleteThis = !ticketClosed && (isOwn || canDeleteAny);
            const isEditing = editingId === c.id;
            const translation = translations[c.id];
            const showingOriginal = !translation || showOriginalIds.has(c.id);
            const displayBody = showingOriginal ? c.body : translation.text;
            const canShowActions =
              canEditThis || canDeleteThis || !!onTranslate;

            return (
              <div
                key={c.id}
                className={cn("flex items-end gap-2", isOwn && "justify-end")}
              >
                {!isOwn && (
                  <Avatar size="sm" className="mb-4">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "flex max-w-[75%] flex-col",
                    isOwn ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-1.5 px-1 mb-0.5">
                    {!isOwn && (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {name}
                      </span>
                    )}
                    {c.isInternal && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 gap-0.5 border-amber-500/40 text-amber-700 dark:text-amber-300"
                      >
                        <Lock className="size-2.5" />
                        Nội bộ
                      </Badge>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="w-full min-w-[220px] space-y-1.5">
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={2}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          disabled={editPending || !editBody.trim()}
                          onClick={() => saveEdit(c)}
                        >
                          Lưu
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/bubble flex items-center gap-1">
                      {isOwn && canShowActions && (
                        <CommentActionsMenu
                          canEdit={canEditThis}
                          canDelete={canDeleteThis}
                          canTranslate={!!onTranslate}
                          translating={translatingId === c.id}
                          onEdit={() => startEdit(c)}
                          onDelete={() => setDeleteTarget(c)}
                          onTranslate={(lang) => handleTranslate(c, lang)}
                        />
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                          isOwn
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground",
                        )}
                      >
                        {displayBody}
                      </div>
                      {!isOwn && canShowActions && (
                        <CommentActionsMenu
                          canEdit={canEditThis}
                          canDelete={canDeleteThis}
                          canTranslate={!!onTranslate}
                          translating={translatingId === c.id}
                          onEdit={() => startEdit(c)}
                          onDelete={() => setDeleteTarget(c)}
                          onTranslate={(lang) => handleTranslate(c, lang)}
                        />
                      )}
                    </div>
                  )}

                  {translation && (
                    <button
                      type="button"
                      onClick={() => toggleShowOriginal(c.id)}
                      className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground px-1 mt-0.5"
                    >
                      {showingOriginal
                        ? `Xem bản dịch (${LANGUAGE_LABEL[translation.lang] ?? translation.lang})`
                        : "Xem bản gốc"}
                    </button>
                  )}

                  {c.attachmentFileIds && c.attachmentFileIds.length > 0 && (
                    <div className="mt-1.5">
                      <TicketAttachments
                        fileIds={c.attachmentFileIds}
                        label={null}
                        compact
                      />
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground px-1 mt-0.5">
                    {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                    {!!c.editCount && c.editCount > 0 && " · đã chỉnh sửa"}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletePending}
              onClick={confirmDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CommentActionsMenu({
  canEdit,
  canDelete,
  canTranslate,
  translating,
  onEdit,
  onDelete,
  onTranslate,
}: {
  canEdit: boolean;
  canDelete: boolean;
  canTranslate: boolean;
  translating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTranslate: (lang: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground"
          />
        }
      >
        <EllipsisVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {canEdit && <DropdownMenuItem onClick={onEdit}>Sửa</DropdownMenuItem>}
        {canTranslate && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {translating ? "Đang dịch..." : "Dịch sang"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {LANGUAGE_OPTIONS.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  disabled={translating}
                  onClick={() => onTranslate(l.code)}
                >
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Xóa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
