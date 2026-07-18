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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  escalateSchema,
  type EscalateFormValues,
} from "@/features/manager/schemas/ticket.schema";
import { EscalationReasonEnum } from "@/shared/types/ticket.types";
import { useEscalateTicket } from "@/features/manager/hooks/useManagerTickets";

const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Vượt quá năng lực kỹ thuật",
  PartsRequired: "Cần linh kiện không có sẵn",
  SafetyConcern: "Lo ngại về an toàn",
  SlaBreach: "SLA đã vi phạm",
  CustomerComplaint: "Khiếu nại của khách hàng",
};

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function EscalateDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useEscalateTicket(ticketId);

  const form = useForm<EscalateFormValues>({
    resolver: zodResolver(escalateSchema),
    defaultValues: { reason: undefined, note: "" },
  });

  const onSubmit = async (values: EscalateFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển cấp xử lý</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do chuyển cấp *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.entries(EscalationReasonEnum).map(
                      ([, v]) => ({
                        value: v,
                        label: ESCALATION_REASON_LABEL[v],
                      }),
                    )}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn lý do" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(EscalationReasonEnum).map(([, v]) => (
                        <SelectItem key={v} value={v}>
                          {ESCALATION_REASON_LABEL[v]}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú bổ sung (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ghi chú..." {...field} />
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
                {isPending ? "Đang xử lý..." : "Chuyển cấp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
