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
import { EscalationReasonEnum } from "@/shared/types/ticket.types";
import {
  escalateRequestSchema,
  type EscalateRequestFormValues,
} from "../schemas/staff-ticket.schema";

const ESCALATION_REASON_LABELS: Record<string, string> = {
  [EscalationReasonEnum.SkillGap]: "Vượt quá năng lực kỹ thuật",
  [EscalationReasonEnum.PartsRequired]: "Cần linh kiện không có sẵn",
  [EscalationReasonEnum.SafetyConcern]: "Lo ngại về an toàn",
  [EscalationReasonEnum.SlaBreach]: "SLA đã vi phạm",
  [EscalationReasonEnum.CustomerComplaint]: "Khiếu nại của khách hàng",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EscalateRequestFormValues) => void;
  isPending: boolean;
}

export function EscalateRequestDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const form = useForm<EscalateRequestFormValues>({
    resolver: zodResolver(escalateRequestSchema),
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu chuyển cấp</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Lý do chuyển cấp <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lý do" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ESCALATION_REASON_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
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
                  <FormLabel>Ghi chú bổ sung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả thêm tình huống..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
