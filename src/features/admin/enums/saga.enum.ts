// States of AlertTicketSagaStateMachine (BE returns a string via `currentState`).
// MassTransit stores state as a string — not a numeric enum like the other BE enums.
// Source: TicketService.Infrastructure/Sagas/AlertTicketSagaStateMachine.cs
// Lifecycle: Initial → TicketRequested → TicketProvisioned → AlertLinkRequested → Completed.
// Failed is terminal — any stage that is rejected or runs out of retries.
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
  [SagaStateEnum.Initial]: "Initializing",
  [SagaStateEnum.TicketRequested]: "Creating ticket",
  [SagaStateEnum.TicketProvisioned]: "Ticket created",
  [SagaStateEnum.AlertLinkRequested]: "Linking alert",
  [SagaStateEnum.Completed]: "Completed",
  [SagaStateEnum.Failed]: "Failed",
};

// Unknown state (BE added a new state the FE hasn't caught up with) → show the raw string instead of blank.
export const sagaStateLabel = (s: string) =>
  SAGA_STATE_LABELS[s as SagaStateEnum] ?? s;
