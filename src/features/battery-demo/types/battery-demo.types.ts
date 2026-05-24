export type BatteryStatus = "Normal" | "Degrading" | "Failed";

export interface SensorReading {
  voltage: number;
  current: number;
  temperature: number;
  recordedAt: string;
}

export interface BatteryDemo {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  status: BatteryStatus;
  soh: number;
  lastReading: SensorReading;
}
