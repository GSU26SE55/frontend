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
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";
import {
  getMinTierForPriority,
  getTierRequirementHint,
  isEligiblePrimaryHandler,
  staffOptionLabel,
} from "@/shared/utils/ticket/staffTier";

interface Props {
  ticketId: string;
  /** Priority ticket — quyết định tier tối thiểu của Primary Handler mới. */
  priority: TicketPriorityEnum | null;
  open: boolean;
  onClose: () => void;
}

export default function ReassignDialog({
  ticketId,
  priority,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useReassignTicket(ticketId);
  const { data: staffList = [], isLoading: loadingStaff } =
    useStaffAssignmentList();

  const minTier = getMinTierForPriority(priority);
  const tierHint = getTierRequirementHint(priority);
  const staffOptions = staffList.map((s) => ({
    ...s,
    eligible: isEligiblePrimaryHandler(s.skillTier, minTier),
  }));
  const hasEligibleStaff = staffOptions.some((s) => s.eligible);

  const form = useForm<ReassignFormValues>({
    resolver: zodResolver(reassignSchema),
    defaultValues: { newPrimaryHandlerStaffId: "", reason: "" },
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
          <p className="text-xs text-muted-foreground">
            Staff phụ trách chính hiện tại sẽ chuyển thành Staff hỗ trợ. SLA
            không được đặt lại.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPrimaryHandlerStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff phụ trách chính mới *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={staffOptions.map((s) => ({
                      value: s.accountId,
                      label: staffOptionLabel(s),
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
                      {staffOptions.map((s) => (
                        <SelectItem
                          key={s.accountId}
                          value={s.accountId}
                          disabled={!s.eligible}
                        >
                          {staffOptionLabel(s)}
                          {!s.eligible && " — không đủ tier"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tierHint && (
                    <p className="text-xs text-muted-foreground">{tierHint}</p>
                  )}
                  {!loadingStaff && !hasEligibleStaff && staffList.length > 0 && (
                    <p className="text-xs text-destructive">
                      Không có Staff nào đủ tier cho ticket này.
                    </p>
                  )}
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
