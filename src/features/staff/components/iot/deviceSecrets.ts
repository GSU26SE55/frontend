import type {
  IotDeviceCreatedDto,
  IotDeviceDetailDto,
} from "@/shared/types/iot/iot.types";

/**
 * Hình dạng tối thiểu mà dialog cần — nhận được CẢ hai nguồn:
 *   • `IotDeviceCreatedDto` — trả lúc xoay khoá (có `rawApiKey`)
 *   • `IotDeviceDetailDto`  — trả bởi `GET /{id}`, xem lại được nhiều lần
 *
 * Bản sao của `features/admin/components/iot/deviceSecrets.ts` — `features/staff` không được
 * import từ `features/admin` (`no-restricted-imports`).
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
