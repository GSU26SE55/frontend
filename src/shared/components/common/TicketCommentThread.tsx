import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
}

/** Khung chat dạng bong bóng — TÁCH 2 tab: Công khai (khách thấy) & Nội bộ (chỉ nhân viên). */
export function TicketCommentThread({
  comments,
  currentUserId,
  activeTab,
  onTabChange,
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
            const isOwn = !!currentUserId && c.authorUserId === currentUserId;
            const name =
              c.authorDisplayName ?? ROLE_LABEL[c.authorRole] ?? c.authorRole;

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
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                      // Bong bóng nội bộ tô amber để phân biệt rõ với công khai.
                      c.isInternal
                        ? isOwn
                          ? "rounded-br-sm bg-amber-500/20 text-amber-900 dark:text-amber-100 border border-amber-500/30"
                          : "rounded-bl-sm bg-amber-500/10 text-amber-900 dark:text-amber-100 border border-amber-500/25"
                        : isOwn
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {c.body}
                  </div>
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
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
