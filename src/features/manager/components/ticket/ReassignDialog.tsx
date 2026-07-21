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
  reassignSchema,
  type ReassignFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useReassignTicket } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function ReassignDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useReassignTicket(ticketId);
  const { data: staffList = [], isLoading: loadingStaff } =
    useStaffAssignmentList();

  const form = useForm<ReassignFormValues>({
    resolver: zodResolver(reassignSchema),
    defaultValues: { newStaffId: "", reason: "" },
  });

  const onSubmit = async (values: ReassignFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chuyển Staff</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn Staff mới *</FormLabel>
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
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingStaff ? "Đang tải..." : "Chọn nhân viên"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {staffList.length === 0 && (
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do điều chuyển</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Lý do..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || loadingStaff}>
                {isPending ? "Đang xử lý..." : "Điều chuyển"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
