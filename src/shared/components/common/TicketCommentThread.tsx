import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { EllipsisVertical, Globe, Lock, Sparkles } from "lucide-react";
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
import VoiceMessagePlayer from "@/shared/components/common/VoiceMessagePlayer";
import ChatAiPanel from "@/shared/components/common/ChatAiPanel";
import ChatReactionBar from "@/shared/components/common/ChatReactionBar";
import {
  isFileId,
  useAudioAttachment,
} from "@/shared/hooks/file/useAudioAttachment";
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

interface CommentBubbleContentProps {
  comment: TicketCommentDTO;
  /** Body đã tính (gốc hoặc bản dịch) — dùng làm nội dung bubble/transcript. */
  displayBody: string;
  isOwn: boolean;
  canShowActions: boolean;
  actionsMenu: React.ReactNode;
  /** GH-133 C3 — bật nút download attachment (chat-attachment endpoint) khi có ticketId. */
  ticketId?: string;
}

/**
 * Nội dung 1 bình luận (chế độ xem, không phải đang sửa): quyết định render tin nhắn thoại
 * (kiểu Zalo) hay bubble text + ảnh đính kèm thường.
 *
 * Voice message (BE tạo từ /chats/voice): body = transcript + đúng 1 attachment là file audio.
 * Hook hỏi metadata để chốt contentType audio; đồng thời lọc bỏ fileId không phải GUID
 * (URL rác/legacy) — nguyên nhân 404 khi ghép /api/files/{fullUrl}/download.
 */
function CommentBubbleContent({
  comment,
  displayBody,
  isOwn,
  canShowActions,
  actionsMenu,
  ticketId,
}: CommentBubbleContentProps) {
  const fileIds = (comment.attachmentFileIds ?? []).filter(isFileId);
  const hasBody = !!comment.body?.trim();
  const voiceCandidateId =
    hasBody && fileIds.length === 1 ? fileIds[0] : undefined;
  const { isAudio } = useAudioAttachment(voiceCandidateId);
  const isVoice = isAudio === true;

  if (isVoice) {
    return (
      <div className="group/bubble flex items-center gap-1">
        {isOwn && canShowActions && actionsMenu}
        <div
          className={cn(
            "rounded-2xl px-3 py-2",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          <VoiceMessagePlayer
            fileId={voiceCandidateId!}
            transcript={displayBody}
            isOwn={isOwn}
          />
        </div>
        {!isOwn && canShowActions && actionsMenu}
      </div>
    );
  }

  return (
    <>
      <div className="group/bubble flex items-center gap-1">
        {isOwn && canShowActions && actionsMenu}
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
        {!isOwn && canShowActions && actionsMenu}
      </div>

      {fileIds.length > 0 && (
        <div className="mt-1.5">
          <TicketAttachments
            fileIds={fileIds}
            label={null}
            compact
            ticketId={ticketId}
            chatId={comment.id}
          />
        </div>
      )}
    </>
  );
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
  /** GH-133 C2 — ticketId để gọi AI endpoint (bắt buộc nếu bật aiEnabled) */
  ticketId?: string;
  /** GH-133 C2 — hiện thanh AI (suggest/summarize/sentiment/export). Page tự gate role. */
  aiEnabled?: boolean;
  /** Khi chọn 1 gợi ý AI, page có thể đổ nội dung xuống composer riêng theo role. */
  onSelectSuggestion?: (text: string) => void;
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
  /** GH-133 C4 — Admin override sửa/xóa chat khi ticket đã Closed (chỉ Admin truyền cả 2). */
  onOverrideEdit?: (chat: TicketCommentDTO) => void;
  onOverrideDelete?: (chat: TicketCommentDTO) => void;
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
  ticketId,
  aiEnabled = false,
  onSelectSuggestion,
  onEdit,
  onDelete,
  editPending = false,
  deletePending = false,
  onMarkRead,
  onTranslate,
  onOverrideEdit,
  onOverrideDelete,
}: TicketCommentThreadProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>("public");
  const tab = activeTab ?? internalTab;
  const setTab = (t: ChatTab) => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  // GH-133 — gợi ý AI hiển thị dạng bong bóng cuối luồng chat (phía người chat).
  // Bấm chọn → đổ vào ô nhập nhưng KHÔNG xóa (user có thể đổi option khác);
  // chỉ xóa khi user đã gửi tin nhắn thành công (số tin của chính mình tăng).
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const pickSuggestion = (text: string) => {
    onSelectSuggestion?.(text);
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
  const isFirstScrollRef = useRef(true);
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    // Tìm tổ tiên có thanh cuộn dọc (overflowY is auto/scroll)
    let parent = el.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        break;
      }
      parent = parent.parentElement;
    }
    const container = parent || document.documentElement;

    const isFirst = isFirstScrollRef.current;
    isFirstScrollRef.current = false;
    const behavior = isFirst ? "auto" : "smooth";

    const performScroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    };

    // Thực hiện cuộn ngay lập tức
    performScroll();

    // Thực hiện lại sau các khoảng trễ để chờ layout / ảnh / audio player vẽ xong hoàn toàn
    const t1 = setTimeout(performScroll, 50);
    const t2 = setTimeout(performScroll, 150);
    const t3 = setTimeout(performScroll, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible.length, tab, aiSuggestions.length]);

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

  // Xóa gợi ý AI khi user đã gửi tin (số tin của chính mình tăng lên).
  const ownCount = useMemo(
    () =>
      currentUserId
        ? comments.filter((c) => c.authorUserId === currentUserId).length
        : 0,
    [comments, currentUserId],
  );
  const prevOwnCountRef = useRef(ownCount);
  useEffect(() => {
    if (ownCount > prevOwnCountRef.current && aiSuggestions.length > 0) {
      setAiSuggestions([]);
    }
    prevOwnCountRef.current = ownCount;
  }, [ownCount, aiSuggestions.length]);

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
        {aiEnabled && ticketId && (
          <div className="ml-auto">
            <ChatAiPanel ticketId={ticketId} onSuggestions={setAiSuggestions} />
          </div>
        )}
      </div>

      {/* Ghi chú ngữ cảnh tab đang xem */}
      <p className="text-[11px] text-muted-foreground px-1 pt-2 pb-1 shrink-0">
        {tab === "public"
          ? "Bình luận công khai — khách hàng có thể xem."
          : "Bình luận nội bộ — chỉ nhân viên xử lý ticket xem được."}
      </p>

      {visible.length === 0 && aiSuggestions.length === 0 ? (
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
            // C4 — Admin override chỉ khi ticket Closed và page có truyền handler.
            const canOverride =
              ticketClosed && !!onOverrideEdit && !!onOverrideDelete;
            const canShowActions =
              canEditThis || canDeleteThis || !!onTranslate || canOverride;

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
                    <CommentBubbleContent
                      comment={c}
                      displayBody={displayBody}
                      isOwn={isOwn}
                      canShowActions={canShowActions}
                      ticketId={ticketId}
                      actionsMenu={
                        <CommentActionsMenu
                          canEdit={canEditThis}
                          canDelete={canDeleteThis}
                          canTranslate={!!onTranslate}
                          canOverride={canOverride}
                          translating={translatingId === c.id}
                          onEdit={() => startEdit(c)}
                          onDelete={() => setDeleteTarget(c)}
                          onTranslate={(lang) => handleTranslate(c, lang)}
                          onOverrideEdit={() => onOverrideEdit?.(c)}
                          onOverrideDelete={() => onOverrideDelete?.(c)}
                        />
                      }
                    />
                  )}

                  {!isEditing && ticketId && (
                    <ChatReactionBar
                      ticketId={ticketId}
                      chatId={c.id}
                      currentUserId={currentUserId}
                      align={isOwn ? "end" : "start"}
                    />
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

          {aiSuggestions.length > 0 && (
            <div className="flex items-end gap-2 justify-end">
              <div className="flex max-w-[85%] flex-col items-end gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground px-1">
                  <Sparkles className="size-3" />
                  Gợi ý trả lời (AI) — bấm để chèn vào ô nhập
                </span>
                {aiSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full rounded-2xl rounded-br-md border border-primary/30 bg-primary/5 px-3 py-2 text-right text-sm whitespace-pre-wrap break-words transition-colors hover:bg-primary/10 hover:border-primary/50"
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAiSuggestions([])}
                  className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground px-1"
                >
                  Bỏ qua gợi ý
                </button>
              </div>
            </div>
          )}

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
  canOverride,
  translating,
  onEdit,
  onDelete,
  onTranslate,
  onOverrideEdit,
  onOverrideDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  canTranslate: boolean;
  canOverride: boolean;
  translating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTranslate: (lang: string) => void;
  onOverrideEdit: () => void;
  onOverrideDelete: () => void;
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
        {canOverride && (
          <DropdownMenuItem onClick={onOverrideEdit}>
            Sửa (override)
          </DropdownMenuItem>
        )}
        {canOverride && (
          <DropdownMenuItem variant="destructive" onClick={onOverrideDelete}>
            Xóa (override)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
