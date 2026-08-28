import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleErrorApi } from "@/shared/lib/errors";
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
import { MaintenanceLogTypeEnum } from "@/shared/types/ticket/ticket.types";
import type { MaintenanceLogDTO } from "@/shared/types/ticket/ticket.types";
import {
  maintenanceLogUpdateSchema,
  type MaintenanceLogUpdateFormValues,
} from "@/features/staff/schemas/ticket/staff-ticket.schema";
import { useUpdateMaintenanceLog } from "@/features/staff/hooks/ticket/useStaffTicketMutations";

const LOG_TYPE_LABELS: Record<string, string> = {
  [MaintenanceLogTypeEnum.RemoteSupport]: "Remote support",
  [MaintenanceLogTypeEnum.OnSite]: "On-site visit",
  [MaintenanceLogTypeEnum.PartReplacement]: "Part replacement",
  [MaintenanceLogTypeEnum.Inspection]: "Routine inspection",
};

interface Props {
  ticketId: string;
  log: MaintenanceLogDTO;
  open: boolean;
  onClose: () => void;
}

export function EditMaintenanceLogDialog({
  ticketId,
  log,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useUpdateMaintenanceLog(ticketId);

  const form = useForm<MaintenanceLogUpdateFormValues>({
    resolver: zodResolver(maintenanceLogUpdateSchema),
    defaultValues: {
      logType: log.logType,
      summary: log.summary ?? "",
      diagnosisDetails: log.diagnosisDetails ?? "",
      actionsTaken: log.actionsTaken ?? "",
      durationMinutes: log.durationMinutes,
      resolutionNote: log.resolutionNote ?? "",
    },
  });

  // Reset the form every time the dialog opens for a different log.
  useEffect(() => {
    if (open) {
      form.reset({
        logType: log.logType,
        summary: log.summary ?? "",
        diagnosisDetails: log.diagnosisDetails ?? "",
        actionsTaken: log.actionsTaken ?? "",
        durationMinutes: log.durationMinutes,
        resolutionNote: log.resolutionNote ?? "",
      });
    }
  }, [open, log, form]);

  const onSubmit = async (data: MaintenanceLogUpdateFormValues) => {
    try {
      await mutateAsync({ logId: log.id, data });
      onClose();
    } catch (error) {
      // EntityError (400 + listErrors) → message lands on the field the BE rejected;
      // anything else → toast. `mutate` swallowed the rejection, leaving the dialog open
      // with nothing to explain why.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit maintenance log</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="logType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Log type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    items={Object.entries(LOG_TYPE_LABELS).map(([v, l]) => ({
                      value: v,
                      label: l,
                    }))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
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
                    Work summary <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                  <FormLabel>Diagnosis details</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                  <FormLabel>Actions taken</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
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
              name="resolutionNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution note</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
