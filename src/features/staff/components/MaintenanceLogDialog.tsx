import { useCallback, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  KbArticleSelector,
  type KbArticleSearchParams,
} from "@/shared/components/common/kb/KbArticleSelector";
import FileUploadField from "@/shared/components/file/FileUploadField";
import { FilePurposeEnum } from "@/shared/types/file-storage.types";
import { MaintenanceLogTypeEnum } from "@/shared/types/ticket.types";
import { KbArticleStatusEnum, KbCategoryCode } from "@/shared/enums/kb.enum";
import { staffKbService } from "../services/kb.service";
import {
  maintenanceLogSchema,
  type MaintenanceLogFormValues,
} from "../schemas/staff-ticket.schema";

const LOG_TYPE_LABELS: Record<string, string> = {
  [MaintenanceLogTypeEnum.RemoteSupport]: "Hỗ trợ từ xa",
  [MaintenanceLogTypeEnum.OnSite]: "Đến tại chỗ",
  [MaintenanceLogTypeEnum.PartReplacement]: "Thay linh kiện",
  [MaintenanceLogTypeEnum.Inspection]: "Kiểm tra định kỳ",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceLogFormValues) => void;
  isPending: boolean;
}

export function MaintenanceLogDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const uploading = uploadingBefore || uploadingAfter;
  const form = useForm<MaintenanceLogFormValues>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: { logType: MaintenanceLogTypeEnum.RemoteSupport },
  });

  // Dialog mount sẵn (open prop điều khiển ẩn/hiện) → clear ảnh mỗi lần mở
  // để log mới không kế thừa ảnh của log trước.
  useEffect(() => {
    if (open) {
      form.setValue("beforePhotos", []);
      form.setValue("afterPhotos", []);
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const searchArticles = useCallback(
    ({ q, category }: KbArticleSearchParams) =>
      staffKbService
        .getList({
          q,
          category: category ? KbCategoryCode[category] : undefined,
          status: KbArticleStatusEnum.Published,
          pageSize: 20,
        })
        .then((r) => r.data.data?.items ?? []),
    [],
  );

  const getArticleDetail = useCallback(
    (id: string) => staffKbService.getDetail(id).then((r) => r.data.data!),
    [],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm nhật ký bảo trì</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="logType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại nhật ký</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                    <Textarea
                      placeholder="Mô tả công việc đã thực hiện..."
                      rows={3}
                      {...field}
                    />
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
                    <Textarea
                      placeholder="Kết quả chẩn đoán..."
                      rows={2}
                      {...field}
                    />
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
                    <Textarea
                      placeholder="Liệt kê các bước đã thực hiện..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                        placeholder="60"
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
                name="partsUsed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linh kiện đã dùng</FormLabel>
                    <FormControl>
                      <Input placeholder="Mô tả linh kiện..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="resolutionNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú kết quả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kết quả sau khi xử lý..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relatedKbArticleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bài viết KB liên quan</FormLabel>
                  <FormControl>
                    <KbArticleSelector
                      value={field.value ?? []}
                      onChange={field.onChange}
                      searchFn={searchArticles}
                      getDetailFn={getArticleDetail}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="beforePhotos"
                render={({ field }) => (
                  <FileUploadField
                    purpose={FilePurposeEnum.MaintenancePhoto}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onUploadingChange={setUploadingBefore}
                    label="Ảnh trước"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="afterPhotos"
                render={({ field }) => (
                  <FileUploadField
                    purpose={FilePurposeEnum.MaintenancePhoto}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onUploadingChange={setUploadingAfter}
                    label="Ảnh sau"
                  />
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? "Đang lưu..." : "Lưu nhật ký"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
