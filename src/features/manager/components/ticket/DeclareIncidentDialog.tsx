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
  declareIncidentSchema,
  type DeclareIncidentFormValues,
} from "@/features/manager/schemas/ticket/ticket.schema";
import { useDeclareIncident } from "@/features/manager/hooks/ticket/useManagerTickets";

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function DeclareIncidentDialog({
  ticketId,
  open,
  onClose,
}: Props) {
  const { mutateAsync, isPending } = useDeclareIncident(ticketId);

  const form = useForm<DeclareIncidentFormValues>({
    resolver: zodResolver(declareIncidentSchema),
    defaultValues: { incidentDescription: "" },
  });

  const onSubmit = async (values: DeclareIncidentFormValues) => {
    await mutateAsync(values.incidentDescription.trim());
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Declare Incident</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark this ticket as a major incident to prioritize it. This action
              is logged to the history and cannot be repeated.
            </p>
            <FormField
              control={form.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Incident description{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief reason for declaring this incident..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Processing..." : "Declare Incident"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
