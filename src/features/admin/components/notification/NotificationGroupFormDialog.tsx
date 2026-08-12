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
  /** null ⇒ create mode; a value ⇒ editing that group. */
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
    // The dialog is remounted via `key` on the page side whenever the target changes, so
    // defaultValues is enough — no reset effect needed (which tends to cause a render tick with
    // the previous group's data).
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
      // EntityError → error shown under the right input field; HttpError (409 duplicate name) → toast.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Edit group: ${editTarget.name}`
              : "Create recipient group"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? (
              <>
                Only the name and description can be changed. To change how the
                group selects members, create a new group instead — changing it
                in place would completely change the recipient set without
                anyone noticing.
              </>
            ) : (
              <>
                A new group is always a <b>manually selected list</b>: you
                add/remove people individually. <b>Role-based</b> groups already
                exist as 4 system groups that auto-update based on accounts, so
                you don't need to create more.
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
                    Group name{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{GROUP_NAME_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Weekend incident on-call"
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
                    Description{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({field.value?.length ?? 0}/{GROUP_DESCRIPTION_MAX})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What this group is for (optional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              Group names must be unique, case-insensitive.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
