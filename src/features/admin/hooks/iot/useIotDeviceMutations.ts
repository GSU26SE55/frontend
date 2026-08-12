import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { iotDeviceService } from "@/features/admin/services/iot/iot-device.service";
import type {
  CreateIotDevicePayload,
  UpdateIotDevicePayload,
  SendCommandPayload,
} from "@/shared/types/iot/iot.types";

export function useCreateIotDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIotDevicePayload) =>
      iotDeviceService.create(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

export function useUpdateIotDevice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateIotDevicePayload) =>
      iotDeviceService.update(id, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

export function useDeleteIotDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotDeviceService.delete(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

// rotate-key clears revoke + resets issuedAt but does NOT change Status → invalidate detail so
// the UI refetches the new DTO (the Revoke button reappears). Returns IotDeviceCreatedDto to open DeviceSecretsDialog.
export function useRotateIotDeviceKey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => iotDeviceService.rotateKey(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.list() });
    },
  });
}

/**
 * IOT3-76 — xoay RIÊNG credential MQTT.
 *
 * Điểm khác `useRotateIotDeviceKey` là toàn bộ giá trị của lệnh này: apiKey KHÔNG đổi, nên thiết
 * bị vẫn gọi được `/provision` và tự nhận mật khẩu MQTT mới. Xoay apiKey thì thiết bị mất cả hai
 * đường và bắt buộc phải mang cáp ra tận nơi.
 */
export function useRotateIotDeviceMqtt(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => iotDeviceService.rotateMqtt(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.list() });
    },
  });
}

// revoke-key set apiKeyRevokedAt + Status=Disabled → invalidate detail (nút Revoke ẩn).
export function useRevokeIotDeviceKey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => iotDeviceService.revokeKey(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.iotDevices.list() });
    },
  });
}

export function useSendIotDeviceCommand(id: string) {
  return useMutation({
    mutationFn: (payload: SendCommandPayload) =>
      iotDeviceService.sendCommand(id, payload).then((r) => r.data),
  });
}
