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
  resolveSchema,
  type ResolveFormValues,
} from "../schemas/staff-ticket.schema";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResolveFormValues) => void;
  isPending: boolean;
}

export function ResolveDialog({ open, onClose, onSubmit, isPending }: Props) {
  const form = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo hoàn thành</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="resolutionSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tóm tắt cách giải quyết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả cách bạn đã xử lý vấn đề..."
                      rows={4}
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang xử lý..." : "Xác nhận hoàn thành"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
