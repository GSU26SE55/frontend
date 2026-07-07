import { Badge } from "@/components/ui/badge";
import { IotDeviceStatusEnum } from "@/shared/enums/iot.enum";

const CONFIG: Record<
  IotDeviceStatusEnum,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [IotDeviceStatusEnum.Pending]: { label: "Chờ provision", variant: "outline" },
  [IotDeviceStatusEnum.Active]: { label: "Hoạt động", variant: "default" },
  [IotDeviceStatusEnum.Offline]: { label: "Offline", variant: "secondary" },
  [IotDeviceStatusEnum.Disabled]: {
    label: "Vô hiệu hóa",
    variant: "destructive",
  },
  [IotDeviceStatusEnum.Decommissioned]: {
    label: "Ngừng sử dụng",
    variant: "destructive",
  },
};

interface Props {
  status: IotDeviceStatusEnum;
}

export default function IoTDeviceStatusBadge({ status }: Props) {
  const config = CONFIG[status] ?? {
    label: String(status),
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
