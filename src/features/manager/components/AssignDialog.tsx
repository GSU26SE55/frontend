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
  assignSchema,
  type AssignFormValues,
} from "@/features/manager/schemas/ticket.schema";
import { useAssignTicket } from "@/features/manager/hooks/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/useStaffAssignmentList";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function AssignDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useAssignTicket(ticketId);
  const {
    data: staffList = [],
    isLoading: loadingStaff,
    isError: staffError,
  } = useStaffAssignmentList();

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { staffId: "", notes: "" },
  });

  const onSubmit = async (values: AssignFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gán Staff xử lý</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn Staff *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={staffList.map((s) => ({
                      value: s.accountId,
                      label: s.fullName ?? s.accountId,
                    }))}
                    disabled={loadingStaff}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingStaff
                              ? "Đang tải..."
                              : staffError
                                ? "Lỗi tải danh sách"
                                : "Chọn nhân viên"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {staffError && (
                        <SelectItem value="_error" disabled>
                          Không thể tải danh sách Staff
                        </SelectItem>
                      )}
                      {!staffError && staffList.length === 0 && (
                        <SelectItem value="_empty" disabled>
                          Không có Staff khả dụng
                        </SelectItem>
                      )}
                      {staffList.map((s) => (
                        <SelectItem key={s.accountId} value={s.accountId}>
                          {s.fullName ?? s.accountId}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ghi chú khi gán..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending || loadingStaff || staffError}
              >
                {isPending ? "Đang xử lý..." : "Gán Staff"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
