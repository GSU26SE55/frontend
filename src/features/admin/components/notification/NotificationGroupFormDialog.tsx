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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  notificationGroupFormSchema,
  type NotificationGroupFormValues,
} from "@/features/admin/schemas/notification/notification-group.schema";
import {
  useCreateNotificationGroup,
  useUpdateNotificationGroup,
} from "@/features/admin/hooks/notification/useNotificationGroups";
import {
  GROUP_NAME_MAX,
  GROUP_DESCRIPTION_MAX,
  type NotificationGroupDto,
} from "@/features/admin/types/notification/notification-group.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null ⇒ chế độ tạo mới; có giá trị ⇒ sửa nhóm đó. */
  editTarget: NotificationGroupDto | null;
}

export default function NotificationGroupFormDialog({
  open,
  onOpenChange,
  editTarget,
}: Props) {
  const isEdit = editTarget !== null;
  const create = useCreateNotificationGroup();
  const update = useUpdateNotificationGroup();

  const form = useForm<NotificationGroupFormValues>({
    resolver: zodResolver(notificationGroupFormSchema),
    // Dialog được remount bằng `key` ở phía page mỗi khi đổi mục tiêu, nên defaultValues là đủ —
    // không cần effect reset (vốn hay gây một nhịp render với dữ liệu của nhóm trước).
    defaultValues: {
      name: editTarget?.name ?? "",
      description: editTarget?.description ?? "",
    },
  });

  const onSubmit = async (values: NotificationGroupFormValues) => {
    try {
      const payload = {
        name: values.name,
        description: values.description?.trim() ? values.description : null,
      };
      if (isEdit) await update.mutateAsync({ id: editTarget.id, payload });
      else await create.mutateAsync(payload);
      onOpenChange(false);
    } catch (error) {
      // EntityError → lỗi hiện dưới đúng ô nhập; HttpError (409 trùng tên) → toast.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Sửa nhóm: ${editTarget.name}` : "Tạo nhóm người nhận"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? (
              <>
                Chỉ đổi được tên và mô tả. Muốn đổi cách nhóm chọn thành viên
                thì tạo nhóm mới — đổi tại chỗ sẽ làm tập người nhận thay đổi
                hoàn toàn mà không ai nhận ra.
              </>
            ) : (
              <>
                Nhóm mới luôn là <b>danh sách tự chọn</b>: bạn thêm/bớt từng
                người. Nhóm <b>theo vai trò</b> đã có sẵn 4 nhóm hệ thống, tự
                cập nhật theo tài khoản nên không cần tạo thêm.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tên nhóm{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{GROUP_NAME_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Trực sự cố cuối tuần"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mô tả{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{GROUP_DESCRIPTION_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Nhóm này dùng để làm gì (tuỳ chọn)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              Tên nhóm không được trùng nhau, không phân biệt hoa-thường.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : "Tạo nhóm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
