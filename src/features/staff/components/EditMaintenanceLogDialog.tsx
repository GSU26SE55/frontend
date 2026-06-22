import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MaintenanceLogTypeEnum } from "@/shared/types/ticket.types";
import type { MaintenanceLogDTO } from "@/shared/types/ticket.types";
import {
  maintenanceLogUpdateSchema,
  type MaintenanceLogUpdateFormValues,
} from "../schemas/staff-ticket.schema";
import { useUpdateMaintenanceLog } from "../hooks/useStaffTicketMutations";

const LOG_TYPE_LABELS: Record<string, string> = {
  [MaintenanceLogTypeEnum.RemoteSupport]: "Hỗ trợ từ xa",
  [MaintenanceLogTypeEnum.OnSite]: "Đến tại chỗ",
  [MaintenanceLogTypeEnum.PartReplacement]: "Thay linh kiện",
  [MaintenanceLogTypeEnum.Inspection]: "Kiểm tra định kỳ",
};

interface Props {
  ticketId: string;
  log: MaintenanceLogDTO;
  open: boolean;
  onClose: () => void;
}

export function EditMaintenanceLogDialog({
  ticketId,
  log,
  open,
  onClose,
}: Props) {
  const { mutate, isPending } = useUpdateMaintenanceLog(ticketId);

  const form = useForm<MaintenanceLogUpdateFormValues>({
    resolver: zodResolver(maintenanceLogUpdateSchema),
    defaultValues: {
      logType: log.logType,
      summary: log.summary ?? "",
      diagnosisDetails: log.diagnosisDetails ?? "",
      actionsTaken: log.actionsTaken ?? "",
      durationMinutes: log.durationMinutes,
      resolutionNote: log.resolutionNote ?? "",
    },
  });

  // Reset form mỗi khi mở dialog cho một log khác.
  useEffect(() => {
    if (open) {
      form.reset({
        logType: log.logType,
        summary: log.summary ?? "",
        diagnosisDetails: log.diagnosisDetails ?? "",
        actionsTaken: log.actionsTaken ?? "",
        durationMinutes: log.durationMinutes,
        resolutionNote: log.resolutionNote ?? "",
      });
    }
  }, [open, log, form]);

  const onSubmit = (data: MaintenanceLogUpdateFormValues) => {
    mutate({ logId: log.id, data }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa nhật ký bảo trì</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="logType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại nhật ký</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.entries(LOG_TYPE_LABELS).map(([v, l]) => ({
                      value: v,
                      label: l,
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(LOG_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tóm tắt công việc{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosisDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi tiết chẩn đoán</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionsTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hành động đã thực hiện</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời lượng (phút)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value, 10),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resolutionNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú kết quả</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
