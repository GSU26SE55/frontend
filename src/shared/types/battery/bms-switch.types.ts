// Matches the firmware mapping in cmd_logic.cpp: charge=1, discharge=2, all=3.
// The backend accepts only these values; adding one requires updating both sides.
export const BmsSwitchTarget = {
  Charge: "charge",
  Discharge: "discharge",
  All: "all",
} as const;

export type BmsSwitchTarget =
  (typeof BmsSwitchTarget)[keyof typeof BmsSwitchTarget];

export const BmsSwitchCommandStatus = {
  Pending: 1,
  Ok: 2,
  Failed: 3,
  Rejected: 4,
  Unknown: 5,
  TimedOut: 6,
} as const;

export type BmsSwitchCommandStatus =
  (typeof BmsSwitchCommandStatus)[keyof typeof BmsSwitchCommandStatus];

export interface SetBmsSwitchPayload {
  target: BmsSwitchTarget;
  enable: boolean;
}

export interface BmsSwitchCommandAcceptedDto extends SetBmsSwitchPayload {
  cmdId: string;
  topic: string;
}

export interface BmsSwitchPendingCommandDto extends SetBmsSwitchPayload {
  cmdId: string;
  issuedAt: string;
}

export interface BmsSwitchLastCommandDto extends SetBmsSwitchPayload {
  cmdId: string;
  status: BmsSwitchCommandStatus;
  error: string | null;
  ackedAt: string | null;
}

export interface BmsSwitchStateDto {
  chargeEnabled: boolean | null;
  dischargeEnabled: boolean | null;
  updatedAt: string | null;
  pendingCommand: BmsSwitchPendingCommandDto | null;
  lastCommand: BmsSwitchLastCommandDto | null;
}
