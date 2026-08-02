import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  reprioritizeSchema,
  type ReprioritizeFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";
import { useReprioritizeTicket } from "@/features/manager/hooks/ticket/useManagerTickets";

const PRIORITY_LABEL: Record<TicketPriorityEnum, string> = {
  P1Critical: "P1 — Nghiêm trọng (SLA 4h)",
  P2High: "P2 — Cao (SLA 24h)",
  P3Normal: "P3 — Tiêu chuẩn (SLA 72h)",
};

interface Props {
  ticketId: string;
  /** Priority hiện tại — preselect để Manager thấy mình đang đổi từ đâu. */
  currentPriority?: TicketPriorityEnum | null;
  open: boolean;
  onClose: () => void;
}

export default function ReprioritizeDialog({
  ticketId,
  currentPriority,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useReprioritizeTicket(ticketId);

  const form = useForm<ReprioritizeFormValues>({
    resolver: zodResolver(reprioritizeSchema),
    defaultValues: { priority: currentPriority ?? undefined, reason: "" },
  });

  const onSubmit = async (values: ReprioritizeFormValues) => {
    try {
      await mutateAsync(values);
      form.reset();
      onClose();
    } catch (error) {
      // EntityError (400 + listErrors) → lỗi hiện dưới đúng input; HttpError (404/409)
      // → toast. Không để hook tự handle: handleErrorApi không có setError sẽ nuốt
      // EntityError im lặng, user submit sai mà không thấy gì.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mức ưu tiên</DialogTitle>
          <DialogDescription>
            SLA được tính lại theo mức mới nhưng không reset thời gian đã trôi —
            nếu hạn mới đã qua, ticket bị đánh dấu vi phạm ngay.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mức ưu tiên mới *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.values(TicketPriorityEnum).map((v) => ({
                      value: v,
                      label: PRIORITY_LABEL[v],
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn mức ưu tiên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.values(TicketPriorityEnum).map((v) => (
                        <SelectItem key={v} value={v}>
                          {PRIORITY_LABEL[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do đổi *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Vì sao cần đổi mức ưu tiên..."
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang xử lý..." : "Đổi mức ưu tiên"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
