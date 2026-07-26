import { useForm, useWatch } from "react-hook-form";
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
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useAssignTicket } from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
import StaffMultiSelect from "@/features/manager/components/ticket/StaffMultiSelect";
import type { TicketPriorityEnum } from "@/shared/types/ticket/ticket.types";
import {
  getMinTierForPriority,
  getTierRequirementHint,
  isEligiblePrimaryHandler,
  staffOptionLabel,
} from "@/shared/utils/ticket/staffTier";

interface Props {
  ticketId: string;
  /** Priority ticket — quyết định tier tối thiểu của Primary Handler. */
  priority: TicketPriorityEnum | null;
  open: boolean;
  onClose: () => void;
}

export default function AssignDialog({
  ticketId,
  priority,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useAssignTicket(ticketId);
  const {
    data: staffList = [],
    isLoading: loadingStaff,
    isError: staffError,
  } = useStaffAssignmentList();

  // Nhất quán với ReassignDialog: hiện TẤT CẢ staff, disable người không đủ tier
  // cho Primary (Supporter không check tier). Tier tối thiểu theo priority ticket.
  const minTier = getMinTierForPriority(priority);
  const tierHint = getTierRequirementHint(priority);
  const primaryOptions = staffList.map((s) => ({
    ...s,
    eligible: isEligiblePrimaryHandler(s.skillTier, minTier),
  }));
  const hasEligiblePrimary = primaryOptions.some((s) => s.eligible);

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      primaryHandlerStaffId: "",
      supporterStaffIds: [],
      notes: "",
    },
  });

  const primaryStaffId = useWatch({
    control: form.control,
    name: "primaryHandlerStaffId",
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
              name="primaryHandlerStaffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff phụ trách chính *</FormLabel>
                  <Select
                    onValueChange={(v: string | null) => {
                      field.onChange(v ?? "");
                      // Primary không được đồng thời là Supporter (BE reject).
                      form.setValue(
                        "supporterStaffIds",
                        form
                          .getValues("supporterStaffIds")
                          .filter((id) => id !== v),
                      );
                    }}
                    value={field.value}
                    items={primaryOptions.map((s) => ({
                      value: s.accountId,
                      label: staffOptionLabel(s),
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
                      {primaryOptions.map((s) => (
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
                  {!loadingStaff && !staffError && !hasEligiblePrimary && (
                    <p className="text-xs text-destructive">
                      Không có Staff nào đủ tier cho ticket này. Cần nâng tier
                      cho Staff hoặc điều chuyển từ nhóm khác.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supporterStaffIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff hỗ trợ (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <StaffMultiSelect
                      options={staffList
                        .filter((s) => s.accountId !== primaryStaffId)
                        .map((s) => ({
                          value: s.accountId,
                          label: staffOptionLabel(s),
                        }))}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={loadingStaff || !!staffError}
                      placeholder={
                        loadingStaff ? "Đang tải..." : "Chọn nhân viên hỗ trợ"
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Staff hỗ trợ được vào chat nội bộ của ticket nhưng không
                    được tính vào khối lượng công việc. Vai trò này không yêu
                    cầu tier.
                  </p>
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
