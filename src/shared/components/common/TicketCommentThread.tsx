import { useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import { ActorRoleEnum, type TicketCommentDTO } from "@/shared/types/ticket.types";

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

interface TicketCommentThreadProps {
  comments: TicketCommentDTO[];
  currentUserId?: string | null;
  emptyText?: string;
}

/** Khung chat dạng bong bóng — tin của mình bên phải, người khác bên trái kèm avatar. */
export function TicketCommentThread({
  comments,
  currentUserId,
  emptyText = "Chưa có bình luận nào.",
}: TicketCommentThreadProps) {
  // Cũ lên trên, mới nhất ở dưới cùng — chuẩn giao diện chat.
  const sorted = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [sorted.length]);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((c) => {
        const isOwn = !!currentUserId && c.authorUserId === currentUserId;
        const name = c.authorDisplayName ?? ROLE_LABEL[c.authorRole] ?? c.authorRole;

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
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    Nội bộ
                  </Badge>
                )}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                  isOwn
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
  );
}
