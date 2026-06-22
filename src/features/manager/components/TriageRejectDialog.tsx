import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  triageRejectSchema,
  type TriageRejectFormValues,
} from "@/features/manager/schemas/ticket.schema";
import { useTriageRejectTicket } from "@/features/manager/hooks/useManagerTickets";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function TriageRejectDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useTriageRejectTicket(ticketId);

  const form = useForm<TriageRejectFormValues>({
    resolver: zodResolver(triageRejectSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = async (values: TriageRejectFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Từ chối ticket (Triage)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ticket sẽ chuyển sang <strong>Closed (Rejected)</strong> — dùng
              khi ticket không hợp lệ (spam, trùng lặp, ngoài scope dịch vụ).
            </p>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do từ chối</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập lý do..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Huỷ
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Đang xử lý..." : "Từ chối"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
