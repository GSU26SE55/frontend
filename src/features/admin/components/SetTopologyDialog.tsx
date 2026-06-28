import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleErrorApi } from "@/shared/lib/errors";
import { useSetTopology } from "@/features/admin/hooks/useSetTopology";
import {
  topologyFormSchema,
  type TopologyFormValues,
} from "@/features/admin/schemas/topology.schema";
import { ElectricalTopologyEnum } from "@/shared/enums/cascade.enum";
import type { ElectricalTopologyName } from "@/shared/types/cascade.types";

const TOPOLOGY_OPTIONS: { value: string; label: string }[] = [
  {
    value: String(ElectricalTopologyEnum.Independent),
    label: "Độc lập (không kết nối điện)",
  },
  {
    value: String(ElectricalTopologyEnum.SeriesString),
    label: "Nối tiếp (Series String)",
  },
  {
    value: String(ElectricalTopologyEnum.ParallelBank),
    label: "Song song (Parallel Bank)",
  },
  {
    value: String(ElectricalTopologyEnum.SeriesParallel),
    label: "Hỗn hợp (Series-Parallel)",
  },
];

interface SetTopologyDialogProps {
  assetId: string;
  currentTopology?: ElectricalTopologyName;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetTopologyDialog({
  assetId,
  currentTopology,
  open,
  onOpenChange,
}: SetTopologyDialogProps) {
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TopologyFormValues>({
    resolver: zodResolver(topologyFormSchema),
    defaultValues: { electricalTopology: "" },
  });

  const { mutateAsync: setTopology } = useSetTopology(assetId);

  useEffect(() => {
    if (open) {
      const current = currentTopology
        ? String(ElectricalTopologyEnum[currentTopology])
        : "";
      reset({ electricalTopology: current });
    }
  }, [open, currentTopology, reset]);

  const onSubmit = async (data: TopologyFormValues) => {
    try {
      await setTopology({
        electricalTopology: Number(data.electricalTopology),
      });
      toast.success("Đã cập nhật topology — cascade risk được tính lại");
      onOpenChange(false);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gán electrical topology</DialogTitle>
          <DialogDescription>
            Cách đấu nối điện ảnh hưởng trực tiếp tới điểm cascade risk. Sau khi
            lưu, điểm được tính lại ngay.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="electricalTopology">Cách đấu nối *</Label>
            <Controller
              name="electricalTopology"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="electricalTopology">
                    <SelectValue placeholder="Chọn cách đấu nối điện" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPOLOGY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.electricalTopology && (
              <p className="text-sm text-destructive">
                {errors.electricalTopology.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
