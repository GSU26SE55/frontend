import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  addCommentSchema,
  type AddCommentFormValues,
} from "../schemas/staff-ticket.schema";

interface Props {
  onSubmit: (data: AddCommentFormValues) => void;
  isPending: boolean;
}

export function AddCommentForm({ onSubmit, isPending }: Props) {
  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal: false },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
    form.reset();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Thêm bình luận..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="isInternal"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  Nội bộ (ẩn với khách hàng)
                </FormLabel>
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Đang gửi..." : "Gửi"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
