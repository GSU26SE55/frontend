import { format } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinned: TicketCommentDTO[];
  /** Display name for a message's author — the thread already resolves role fallbacks. */
  authorName: (comment: TicketCommentDTO) => string;
  /** Scrolls the thread to this message and closes the dialog. */
  onJumpTo: (chatId: string) => void;
  /** Omitted when the viewer lacks chat.pin — the list stays readable, just not editable. */
  onUnpin?: (comment: TicketCommentDTO) => void;
}

/**
 * The full list of a ticket's pinned messages.
 *
 * The bar above the thread only has room for the most recent one, but the BE allows up to
 * five — so without this the rest are pinned yet invisible.
 */
export default function PinnedMessagesDialog({
  open,
  onOpenChange,
  pinned,
  authorName,
  onJumpTo,
  onUnpin,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pinned messages</DialogTitle>
        </DialogHeader>

        {pinned.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No pinned messages.
          </p>
        ) : (
          <ul className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {pinned.map((c) => (
              <li key={c.id} className="py-3 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium truncate">
                      {authorName(c)}
                    </span>
                    <span className="text-2xs text-muted-foreground shrink-0">
                      {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 line-clamp-3 whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    /* Nudged up so the trigger's centre lines up with the author row above the
                       body, instead of floating between the two lines. */

                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-mt-1 size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      />
                    }
                    aria-label={`Actions for the message from ${authorName(c)}`}
                  >
                    <EllipsisVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onJumpTo(c.id)}>
                      View in conversation
                    </DropdownMenuItem>
                    {/* Only offered to a viewer who holds chat.pin — the BE checks the same
                        permission for unpin as for pin. */}
                    {onUnpin && (
                      <DropdownMenuItem onClick={() => onUnpin(c)}>
                        Unpin
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
