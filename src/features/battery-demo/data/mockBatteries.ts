import type { BatteryDemo } from "@/features/battery-demo/types/battery-demo.types";

export const mockBatteries: BatteryDemo[] = [
  {
    id: "1",
    name: "Battery A1",
    serialNumber: "SN-2024-001",
    location: "Site Hà Nội — Khu A",
    status: "Normal",
    soh: 95,
    lastReading: {
      voltage: 3.72,
      current: 1.5,
      temperature: 25.3,
      recordedAt: "2026-05-24T08:00:00Z",
    },
  },
  {
    id: "2",
    name: "Battery B2",
    serialNumber: "SN-2024-002",
    location: "Site Hồ Chí Minh — Khu B",
    status: "Normal",
    soh: 91,
    lastReading: {
      voltage: 3.68,
      current: 1.42,
      temperature: 27.1,
      recordedAt: "2026-05-24T08:05:00Z",
    },
  },
  {
    id: "3",
    name: "Battery C3",
    serialNumber: "SN-2024-003",
    location: "Site Đà Nẵng — Khu C",
    status: "Normal",
    soh: 88,
    lastReading: {
      voltage: 3.65,
      current: 1.38,
      temperature: 26.5,
      recordedAt: "2026-05-24T07:55:00Z",
    },
  },
  {
    id: "4",
    name: "Battery D4",
    serialNumber: "SN-2024-004",
    location: "Site Hải Phòng — Khu D",
    status: "Normal",
    soh: 98,
    lastReading: {
      voltage: 3.75,
      current: 1.55,
      temperature: 24.8,
      recordedAt: "2026-05-24T08:10:00Z",
    },
  },
];
