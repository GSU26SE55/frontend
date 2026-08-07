// State của AlertTicketSagaStateMachine (BE trả string qua `currentState`).
// MassTransit lưu state dạng string — không phải enum số như các enum BE khác.
// Nguồn: TicketService.Infrastructure/Sagas/AlertTicketSagaStateMachine.cs
// Lifecycle: Initial → TicketRequested → TicketProvisioned → AlertLinkRequested → Completed.
// Failed là terminal — bất kỳ stage nào bị reject hoặc hết retry.
export const SagaStateEnum = {
  Initial: "Initial",
  TicketRequested: "TicketRequested",
  TicketProvisioned: "TicketProvisioned",
  AlertLinkRequested: "AlertLinkRequested",
  Completed: "Completed",
  Failed: "Failed",
} as const;
export type SagaStateEnum = (typeof SagaStateEnum)[keyof typeof SagaStateEnum];

export const SAGA_STATE_LABELS: Record<SagaStateEnum, string> = {
  [SagaStateEnum.Initial]: "Khởi tạo",
  [SagaStateEnum.TicketRequested]: "Đang tạo ticket",
  [SagaStateEnum.TicketProvisioned]: "Đã tạo ticket",
  [SagaStateEnum.AlertLinkRequested]: "Đang liên kết cảnh báo",
  [SagaStateEnum.Completed]: "Hoàn tất",
  [SagaStateEnum.Failed]: "Thất bại",
};

// State lạ (BE thêm state mới mà FE chưa cập nhật) → hiện nguyên chuỗi thay vì rỗng.
export const sagaStateLabel = (s: string) =>
  SAGA_STATE_LABELS[s as SagaStateEnum] ?? s;
