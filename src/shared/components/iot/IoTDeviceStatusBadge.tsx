import { Badge } from "@/components/ui/badge";
import { IotDeviceStatusEnum } from "@/shared/enums/iot.enum";
import { toneClass, IOT_DEVICE_STATUS_TONE } from "@/shared/theme/statusColors";

const LABEL: Record<IotDeviceStatusEnum, string> = {
  [IotDeviceStatusEnum.Pending]: "Chờ provision",
  [IotDeviceStatusEnum.Active]: "Hoạt động",
  [IotDeviceStatusEnum.Offline]: "Offline",
  [IotDeviceStatusEnum.Disabled]: "Vô hiệu hóa",
  [IotDeviceStatusEnum.Decommissioned]: "Ngừng sử dụng",
};

interface Props {
  status: IotDeviceStatusEnum;
}

export default function IoTDeviceStatusBadge({ status }: Props) {
  const label = LABEL[status] ?? String(status);
  const tone = IOT_DEVICE_STATUS_TONE[status] ?? "muted";
  return (
    <Badge variant="outline" className={toneClass(tone)}>
      {label}
    </Badge>
  );
}
