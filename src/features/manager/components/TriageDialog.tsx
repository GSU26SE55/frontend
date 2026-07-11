import { useState } from "react";
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
  triageSchema,
  type TriageFormValues,
} from "@/features/manager/schemas/ticket.schema";
import {
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketPriorityEnum,
} from "@/shared/types/ticket.types";
import { useTriageTicket } from "@/features/manager/hooks/useManagerTickets";

// Impact × Urgency → Priority matrix
const PRIORITY_MATRIX: Record<string, Record<string, TicketPriorityEnum>> = {
  MultiSite: { High: "P1Critical", Medium: "P1Critical", Low: "P1Critical" },
  Site: { High: "P1Critical", Medium: "P2High", Low: "P3Normal" },
  SingleAsset: { High: "P2High", Medium: "P3Normal", Low: "P3Normal" },
};

function computePriority(
  impact?: string,
  urgency?: string,
): TicketPriorityEnum | undefined {
  if (!impact || !urgency) return undefined;
  return PRIORITY_MATRIX[impact]?.[urgency];
}

interface Props {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export default function TriageDialog({ ticketId, open, onClose }: Props) {
  const { mutateAsync, isPending } = useTriageTicket(ticketId);

  const [impact, setImpact] = useState<ImpactScopeEnum | undefined>();
  const [urgency, setUrgency] = useState<UrgencyLevelEnum | undefined>();
  const computed = computePriority(impact, urgency);

  const form = useForm<TriageFormValues>({
    resolver: zodResolver(triageSchema),
    defaultValues: { impact: undefined, urgency: undefined },
  });

  const onSubmit = async (values: TriageFormValues) => {
    await mutateAsync(values);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Triage ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phạm vi ảnh hưởng *</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      setImpact(v as ImpactScopeEnum);
                    }}
                    value={field.value}
                    items={[
                      {
                        value: ImpactScopeEnum.SingleAsset,
                        label: "Single Asset",
                      },
                      { value: ImpactScopeEnum.Site, label: "Site" },
                      { value: ImpactScopeEnum.MultiSite, label: "Multi Site" },
                    ]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phạm vi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={ImpactScopeEnum.SingleAsset}>
                        Single Asset
                      </SelectItem>
                      <SelectItem value={ImpactScopeEnum.Site}>Site</SelectItem>
                      <SelectItem value={ImpactScopeEnum.MultiSite}>
                        Multi Site
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Độ khẩn cấp *</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      setUrgency(v as UrgencyLevelEnum);
                    }}
                    value={field.value}
                    items={[
                      { value: UrgencyLevelEnum.Low, label: "Low" },
                      { value: UrgencyLevelEnum.Medium, label: "Medium" },
                      { value: UrgencyLevelEnum.High, label: "High" },
                    ]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khẩn" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={UrgencyLevelEnum.Low}>Low</SelectItem>
                      <SelectItem value={UrgencyLevelEnum.Medium}>
                        Medium
                      </SelectItem>
                      <SelectItem value={UrgencyLevelEnum.High}>
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {computed && (
              <p className="text-sm text-muted-foreground">
                Priority tính được: <strong>{computed}</strong>
              </p>
            )}

            <FormField
              control={form.control}
              name="managerComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhận xét (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhận xét của Manager..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang xử lý..." : "Xác nhận Triage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
