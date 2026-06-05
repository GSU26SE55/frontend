import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  addCommentSchema,
  type AddCommentFormValues,
} from "@/features/manager/schemas/ticket.schema";
import { useAddComment } from "@/features/manager/hooks/useManagerTickets";

interface Props {
  ticketId: string;
}

export default function AddCommentForm({ ticketId }: Props) {
  const { mutateAsync, isPending } = useAddComment();

  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: "", isInternal: false },
  });

  const onSubmit = async (values: AddCommentFormValues) => {
    await mutateAsync({ ticketId, payload: values });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Nhập bình luận..."
                  className="min-h-[80px]"
                  {...field}
                />
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isInternal"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <Label htmlFor="isInternal" className="text-sm cursor-pointer">
                  Nội bộ (Staff/Manager)
                </Label>
              </div>
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
