import type {
  IotDeviceCreatedDto,
  IotDeviceDetailDto,
} from "@/shared/types/iot/iot.types";

/**
 * Hình dạng tối thiểu mà dialog cần — nhận được CẢ hai nguồn:
 *   • `IotDeviceCreatedDto` — trả lúc tạo / xoay khoá (có `rawApiKey`)
 *   • `IotDeviceDetailDto`  — trả bởi `GET /{id}` (IOT3-70/71), xem lại được nhiều lần
 *
 * Gộp về một kiểu thay vì hai component: nội dung giống hệt nhau, và tách ra thì lần sửa nhãn
 * tiếp theo chỉ sửa được một bên.
 */
export interface DeviceSecrets {
  deviceCode: string;
  displayName: string;
  apiKey: string | null;
  provisioningQrCode: string | null;
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttBrokerHost: string | null;
  mqttBrokerPort: number | null;
  mqttUseTls: boolean | null;
  mqttTopicPrefix: string | null;
}

export function fromCreatedDto(d: IotDeviceCreatedDto): DeviceSecrets {
  return {
    deviceCode: d.deviceCode,
    displayName: d.displayName,
    apiKey: d.rawApiKey,
    provisioningQrCode: d.provisioningQrCode,
    mqttUsername: d.mqttUsername,
    mqttPassword: d.mqttPassword,
    mqttBrokerHost: d.mqttBrokerHost,
    mqttBrokerPort: d.mqttBrokerPort,
    mqttUseTls: d.mqttUseTls,
    mqttTopicPrefix: d.mqttTopicPrefix,
  };
}

export function fromDetailDto(d: IotDeviceDetailDto): DeviceSecrets {
  return {
    deviceCode: d.deviceCode,
    displayName: d.displayName,
    apiKey: d.apiKey,
    provisioningQrCode: d.provisioningQrCode,
    mqttUsername: d.mqttUsername,
    mqttPassword: d.mqttPassword,
    mqttBrokerHost: d.mqttBrokerHost,
    mqttBrokerPort: d.mqttBrokerPort,
    mqttUseTls: d.mqttUseTls,
    mqttTopicPrefix: d.mqttTopicPrefix,
  };
}
