import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  chatOverrideEditSchema,
  chatOverrideDeleteSchema,
  type ChatOverrideEditPayload,
  type ChatOverrideDeletePayload,
} from "@/features/admin/schemas/chat-override.schema";
import {
  useOverrideEditChat,
  useOverrideDeleteChat,
} from "@/features/admin/hooks/useAdminChatOverride";
import type { TicketCommentDTO } from "@/shared/types/ticket.types";

type Mode = "edit" | "delete";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  ticketId: string;
  chat: TicketCommentDTO | null;
}

// GH-133 C4 — Admin sửa/xóa chat trên ticket đã Closed. Bắt buộc overrideReason.
export default function AdminClosedOverrideDialog({
  open,
  onOpenChange,
  mode,
  ticketId,
  chat,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Sửa bình luận (override)"
              : "Xóa bình luận (override)"}
          </DialogTitle>
          <DialogDescription>
            Ticket đã đóng — thao tác này vượt giới hạn thường và ghi vào audit.
            Bắt buộc nhập lý do.
          </DialogDescription>
        </DialogHeader>
        {chat &&
          (mode === "edit" ? (
            <OverrideEditForm
              key={chat.id}
              ticketId={ticketId}
              chat={chat}
              onDone={() => onOpenChange(false)}
            />
          ) : (
            <OverrideDeleteForm
              key={chat.id}
              ticketId={ticketId}
              chat={chat}
              onDone={() => onOpenChange(false)}
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}

function OverrideEditForm({
  ticketId,
  chat,
  onDone,
}: {
  ticketId: string;
  chat: TicketCommentDTO;
  onDone: () => void;
}) {
  const form = useForm<ChatOverrideEditPayload>({
    resolver: zodResolver(chatOverrideEditSchema),
    defaultValues: { body: chat.body, overrideReason: "" },
  });
  const { mutateAsync, isPending } = useOverrideEditChat();

  const onSubmit = async (data: ChatOverrideEditPayload) => {
    try {
      await mutateAsync({ ticketId, chatId: chat.id, payload: data });
      onDone();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="overrideReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do override</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Ví dụ: sửa lỗi dữ liệu..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            Hủy
          </Button>
          <Button type="submit" disabled={isPending}>
            Lưu
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function OverrideDeleteForm({
  ticketId,
  chat,
  onDone,
}: {
  ticketId: string;
  chat: TicketCommentDTO;
  onDone: () => void;
}) {
  const form = useForm<ChatOverrideDeletePayload>({
    resolver: zodResolver(chatOverrideDeleteSchema),
    defaultValues: { overrideReason: "" },
  });
  const { mutateAsync, isPending } = useOverrideDeleteChat();

  const onSubmit = async (data: ChatOverrideDeletePayload) => {
    try {
      await mutateAsync({ ticketId, chatId: chat.id, payload: data });
      onDone();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="overrideReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do override</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Ví dụ: nội dung vi phạm..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            Hủy
          </Button>
          <Button type="submit" variant="destructive" disabled={isPending}>
            Xóa
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
